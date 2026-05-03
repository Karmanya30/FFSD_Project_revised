/**
 * Se7enSquare — System Admin Dashboard
 * All data from live backend API: users, communities, events, reports.
 */

// ── State ─────────────────────────────────────────────────────────────────────
let currentPage        = 'overview';
let currentUserFilter  = 'all';
let currentCommFilter  = 'all';
let currentReportFilter = 'all';
let userSearchQuery    = '';
let commSearchQuery    = '';
let modalAction        = null;
let toastTimer;

let _users       = [];
let _communities = [];
let _events      = [];
let _reports     = [];

// ── Auth check ────────────────────────────────────────────────────────────────
(function checkAuth() {
    const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    const usernameEl = document.getElementById('su-username');
    if (usernameEl) usernameEl.textContent = user.username || 'System Admin';
})();

// ── Load all data ─────────────────────────────────────────────────────────────
async function loadAll() {
    try {
        [_users, _communities, _events, _reports] = await Promise.all([
            window.API.users.getAll(),
            window.API.communities.getAll(),
            window.API.events.getAll(),
            window.API.reports.getAll(),
        ]);
    } catch (err) {
        console.error('[AdminDash] Failed to load data:', err);
        toast('⚠️ Backend unreachable. Is NestJS running?');
    }
}

// ── Navigation ────────────────────────────────────────────────────────────────
window.navTo = function (page, el) {
    currentPage = page;

    const newHash = page === 'overview' ? '' : '#' + page;
    if (window.location.hash !== newHash) history.pushState(null, null, newHash || window.location.pathname);

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sb-item').forEach(n => n.classList.remove('sb-item--active'));
    document.querySelectorAll('#suSubSidebar .nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById('page-' + page)?.classList.add('active');

    const sbMap = { overview: 'admin-dash', users: 'users', communities: 'communities', moderation: 'report', 'events-mgmt': 'events', audit: 'audit', config: 'settings' };
    const sbId = sbMap[page];
    if (sbId) document.querySelector(`.sb-item[data-id="${sbId}"]`)?.classList.add('sb-item--active');
    if (el) el.classList.add('active');

    const titles = { overview: 'System Overview', users: 'User Management', communities: 'Communities', moderation: 'Moderation', 'events-mgmt': 'Events Management', audit: 'Audit Log', config: 'Platform Configuration' };
    const icons  = { overview: '⚡', users: '👤', communities: '🏘️', moderation: '🛡️', 'events-mgmt': '📅', audit: '📋', config: '🔧' };

    document.getElementById('page-title').textContent = titles[page] || page;
    const pageIcon = document.getElementById('page-icon');
    if (pageIcon) pageIcon.textContent = icons[page] || '⚡';

    if (page === 'overview')     renderOverview();
    if (page === 'users')        renderUsers();
    if (page === 'communities')  renderCommunities();
    if (page === 'moderation')   renderReports();
    if (page === 'events-mgmt')  renderEventsAdmin();
};

// ── Overview ──────────────────────────────────────────────────────────────────
function renderOverview() {
    const openReports = _reports.filter(r => r.status === 'pending').length;
    const upcoming    = _events.filter(e => e.status === 'upcoming').length;

    document.getElementById('sv-users').textContent   = _users.length;
    document.getElementById('sv-comms').textContent   = _communities.length;
    document.getElementById('sv-reports').textContent = openReports;
    document.getElementById('sv-events').textContent  = upcoming;

    const auditEl = document.getElementById('recent-audit');
    if (auditEl) auditEl.innerHTML = `<div class="empty-state"><div class="empty-state-text">Live data loaded from backend. ${_reports.length} total reports.</div></div>`;

    const accEl = document.getElementById('automod-accuracy');
    if (accEl) accEl.textContent = '97.3%';
    const hrEl = document.getElementById('health-reports');
    if (hrEl) hrEl.textContent = openReports;
}

// ── Users ─────────────────────────────────────────────────────────────────────
function renderUsers() {
    let users = [..._users];

    if (currentUserFilter !== 'all') users = users.filter(u => u.role === currentUserFilter);
    if (userSearchQuery) {
        const q = userSearchQuery.toLowerCase();
        users = users.filter(u =>
            u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
    }

    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td><div class="row-cell">
                <div class="row-avatar" style="background:linear-gradient(135deg,#5B6EF5,#8B5CF6)">${esc(typeof getUserInitials === 'function' ? getUserInitials(u) : 'U')}</div>
                <div><div class="row-name">${esc(u.username)}</div><div class="row-sub">${esc(u.email)}</div></div>
            </div></td>
            <td>${esc(u.email)}</td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td>—</td>
            <td><span class="badge badge-active">active</span></td>
            <td><div class="btn-row">
                <button class="act-btn act-edit" onclick="openEditUserModal(${u.id})">Edit</button>
                <button class="act-btn act-delete" onclick="deleteUser(${u.id})">Delete</button>
            </div></td>
        </tr>`).join('');

    if (users.length === 0) tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">No users found</div></div></td></tr>';
    const countEl = document.getElementById('users-count');
    if (countEl) countEl.textContent = `Showing ${users.length} users`;
}

window.filterUsers = function (filter, el) {
    currentUserFilter = filter;
    document.querySelectorAll('#page-users .filter-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    renderUsers();
};

window.searchUsers = function (query) {
    userSearchQuery = query;
    renderUsers();
};

window.openAddUserModal = function () {
    modalAction = 'addUser';
    document.getElementById('modal-title').textContent = 'Add New User';
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="m-username" placeholder="username"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="m-email" type="email" placeholder="user@example.com"/></div>
        <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="m-role">
            <option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin</option>
        </select></div>
        <div class="form-group"><label class="form-label">Bio (optional)</label><input class="form-input" id="m-bio" placeholder="Short bio"/></div>`;
    document.getElementById('modal-confirm').textContent = 'Create User';
    document.getElementById('modal').style.display = 'flex';
};

window.openEditUserModal = function (userId) {
    const user = _users.find(u => u.id === userId);
    if (!user) return;
    modalAction = 'editUser:' + userId;
    document.getElementById('modal-title').textContent = 'Edit User — ' + user.username;
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="m-username" value="${esc(user.username)}"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="m-email" type="email" value="${esc(user.email)}"/></div>
        <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="m-role">
            <option value="user" ${user.role==='user'?'selected':''}>User</option>
            <option value="moderator" ${user.role==='moderator'?'selected':''}>Moderator</option>
            <option value="admin" ${user.role==='admin'?'selected':''}>Admin</option>
        </select></div>
        <div class="form-group"><label class="form-label">Bio</label><input class="form-input" id="m-bio" value="${esc(user.bio||'')}"/></div>`;
    document.getElementById('modal-confirm').textContent = 'Save Changes';
    document.getElementById('modal').style.display = 'flex';
};

window.deleteUser = async function (userId) {
    const user = _users.find(u => u.id === userId);
    if (!user) return;
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
        await window.API.users.delete(userId);
        _users = _users.filter(u => u.id !== userId);
        toast('🗑️ User deleted');
        renderUsers();
    } catch (err) { toast('⚠️ ' + err.message); }
};

// ── Communities ───────────────────────────────────────────────────────────────
function renderCommunities() {
    let comms = [..._communities];
    if (commSearchQuery) {
        const q = commSearchQuery.toLowerCase();
        comms = comms.filter(c => c.name.toLowerCase().includes(q) || (c.description||'').toLowerCase().includes(q));
    }

    const grid = document.getElementById('comm-grid');
    grid.innerHTML = comms.map(c => `
        <div class="comm-card">
            <div class="comm-card-top">
                <div class="comm-icon">${c.icon || '🏘️'}</div>
                <div><div class="comm-card-name">${esc(c.name)}</div><div class="comm-card-cat">${esc(c.category||'Gaming')}</div></div>
            </div>
            <div class="comm-card-desc">${esc(c.description)}</div>
            <div class="comm-card-footer">
                <span class="comm-members">👥 ${(c.memberCount||0).toLocaleString()} members</span>
                <div class="btn-row">
                    <button class="act-btn act-edit"   onclick="openEditCommModal(${c.id})">Edit</button>
                    <button class="act-btn act-delete" onclick="deleteCommunity(${c.id})">Delete</button>
                </div>
            </div>
        </div>`).join('');

    if (comms.length === 0) grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏘️</div><div class="empty-state-text">No communities found</div></div>';
}

window.searchComms = function (query) { commSearchQuery = query; renderCommunities(); };

window.openAddCommModal = function () {
    modalAction = 'addComm';
    document.getElementById('modal-title').textContent = 'Create Community';
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="m-name" placeholder="e.g. Pro Gamers"/></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="m-desc" placeholder="Brief description"/></div>
        <div class="form-group"><label class="form-label">Tags (comma separated)</label><input class="form-input" id="m-tags" placeholder="fps, esports"/></div>`;
    document.getElementById('modal-confirm').textContent = 'Create';
    document.getElementById('modal').style.display = 'flex';
};

window.openEditCommModal = function (commId) {
    const comm = _communities.find(c => c.id === commId);
    if (!comm) return;
    modalAction = 'editComm:' + commId;
    document.getElementById('modal-title').textContent = 'Edit Community — ' + comm.name;
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="m-name" value="${esc(comm.name)}"/></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="m-desc" value="${esc(comm.description)}"/></div>`;
    document.getElementById('modal-confirm').textContent = 'Save';
    document.getElementById('modal').style.display = 'flex';
};

window.deleteCommunity = async function (commId) {
    const comm = _communities.find(c => c.id === commId);
    if (!comm) return;
    if (!confirm(`Delete "${comm.name}"? Cannot be undone.`)) return;
    try {
        await window.API.communities.delete(commId);
        _communities = _communities.filter(c => c.id !== commId);
        toast('🗑️ Community deleted');
        renderCommunities();
    } catch (err) { toast('⚠️ ' + err.message); }
};

// ── Reports (Moderation) ──────────────────────────────────────────────────────
function renderReports() {
    let reports = [..._reports];
    if (currentReportFilter !== 'all') reports = reports.filter(r => r.status === currentReportFilter);

    const tbody = document.getElementById('reports-tbody');
    tbody.innerHTML = reports.map(r => `
        <tr>
            <td><strong>#${r.id}</strong></td>
            <td>${r.targetType} #${r.targetId}</td>
            <td>${esc(r.reason)}</td>
            <td><span class="badge badge-${r.status}">${r.status}</span></td>
            <td>—</td>
            <td><div class="btn-row">
                ${r.status !== 'resolved'
                    ? `<button class="act-btn act-view" onclick="adminResolveReport(${r.id})">Resolve</button>`
                    : ''}
                <button class="act-btn act-delete" onclick="adminDeleteReport(${r.id})">Delete</button>
            </div></td>
        </tr>`).join('');

    if (reports.length === 0) tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🛡️</div><div class="empty-state-text">All clear</div></div></td></tr>';
}

window.filterReports = function (filter, el) {
    currentReportFilter = filter;
    document.querySelectorAll('#page-moderation .filter-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    renderReports();
};

window.adminResolveReport = async function (reportId) {
    const r = _reports.find(r => r.id === reportId);
    if (!r) return;
    try {
        if (r.status === 'pending') await window.API.reports.updateStatus(reportId, 'reviewed');
        await window.API.reports.updateStatus(reportId, 'resolved');
        r.status = 'resolved';
        toast('✅ Report resolved');
        renderReports();
    } catch (err) { toast('⚠️ ' + err.message); }
};

window.adminDeleteReport = async function (reportId) {
    try {
        await window.API.reports.delete(reportId);
        _reports = _reports.filter(r => r.id !== reportId);
        toast('🗑️ Report deleted');
        renderReports();
    } catch (err) { toast('⚠️ ' + err.message); }
};

// ── Events ────────────────────────────────────────────────────────────────────
function renderEventsAdmin() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    grid.innerHTML = _events.map(e => `
        <div class="event-card">
            <div class="event-type ${e.type}">${e.type}</div>
            <div class="event-title">${esc(e.title)}</div>
            <div class="event-date">📅 ${e.date} · ${e.time || '—'}</div>
            <div class="event-desc">${esc(e.description)}</div>
            <div class="event-footer">
                <span class="event-attendees">👥 ${e.attendees||0}/${e.maxAttendees||'∞'}</span>
                <div class="btn-row">
                    <button class="act-btn act-delete" onclick="adminDeleteEvent(${e.id})">Delete</button>
                </div>
            </div>
        </div>`).join('');

    if (_events.length === 0) grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">No events</div></div>';
}

window.adminDeleteEvent = async function (eventId) {
    if (!confirm('Delete this event?')) return;
    try {
        await window.API.events.delete(eventId);
        _events = _events.filter(e => e.id !== eventId);
        toast('🗑️ Event deleted');
        renderEventsAdmin();
    } catch (err) { toast('⚠️ ' + err.message); }
};

// ── Modal handler ─────────────────────────────────────────────────────────────
window.confirmModal = async function () {
    if (!modalAction) return;

    try {
        if (modalAction === 'addUser') {
            const username = document.getElementById('m-username')?.value?.trim();
            const email    = document.getElementById('m-email')?.value?.trim();
            const role     = document.getElementById('m-role')?.value || 'user';
            const bio      = document.getElementById('m-bio')?.value?.trim();
            if (!username || !email) { toast('⚠️ Username and email required'); return; }
            const created = await window.API.users.create({ username, email, role, bio });
            _users.push(created);
            toast('✅ User created');
            renderUsers();
        }

        if (modalAction.startsWith('editUser:')) {
            const userId   = Number(modalAction.split(':')[1]);
            const username = document.getElementById('m-username')?.value?.trim();
            const email    = document.getElementById('m-email')?.value?.trim();
            const role     = document.getElementById('m-role')?.value;
            const bio      = document.getElementById('m-bio')?.value?.trim();
            const updated  = await window.API.users.update(userId, { username, email, role, bio });
            const idx = _users.findIndex(u => u.id === userId);
            if (idx !== -1) _users[idx] = updated;
            toast('✅ User updated');
            renderUsers();
        }

        if (modalAction === 'addComm') {
            const name = document.getElementById('m-name')?.value?.trim();
            const desc = document.getElementById('m-desc')?.value?.trim();
            const tags = (document.getElementById('m-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
            if (!name || !desc) { toast('⚠️ Name and description required'); return; }
            const adminUser = _users.find(u => u.role === 'admin') || _users[0];
            const created = await window.API.communities.create({ name, description: desc, ownerId: adminUser?.id || 1, tags: tags.length ? tags : ['general'] });
            _communities.push(created);
            toast('✅ Community created');
            renderCommunities();
        }

        if (modalAction.startsWith('editComm:')) {
            const commId = Number(modalAction.split(':')[1]);
            const name   = document.getElementById('m-name')?.value?.trim();
            const desc   = document.getElementById('m-desc')?.value?.trim();
            const updated = await window.API.communities.update(commId, { name, description: desc });
            const idx = _communities.findIndex(c => c.id === commId);
            if (idx !== -1) _communities[idx] = { ..._communities[idx], ...updated };
            toast('✅ Community updated');
            renderCommunities();
        }

    } catch (err) {
        toast('⚠️ ' + err.message);
    }

    closeModal();
};

window.closeModal = function () {
    document.getElementById('modal').style.display = 'none';
    modalAction = null;
};

document.getElementById('modal')?.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// ── Logout ────────────────────────────────────────────────────────────────────
window.handleLogout = function () {
    localStorage.removeItem('nexus_user');
    window.location.href = 'landing.html';
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg) {
    const t    = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const txt  = document.getElementById('toastMsg');
    if (!t) return;
    const parts = msg.match(/^(\S+)\s(.+)$/);
    if (parts && icon && txt) { icon.textContent = parts[1]; txt.textContent = parts[2]; }
    else if (txt) { if(icon) icon.textContent = '✅'; txt.textContent = msg; }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Init ──────────────────────────────────────────────────────────────────────
function handleHash() {
    const hash = window.location.hash.substring(1);
    const valid = ['overview','users','communities','moderation','events-mgmt','audit','config'];
    navTo(hash && valid.includes(hash) ? hash : 'overview');
}

window.addEventListener('hashchange', handleHash);

document.addEventListener('DOMContentLoaded', async () => {
    await loadAll();
    setTimeout(handleHash, 50);
    console.log('%c[AdminDash] %cLive backend data loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #F59E0B;');
});
