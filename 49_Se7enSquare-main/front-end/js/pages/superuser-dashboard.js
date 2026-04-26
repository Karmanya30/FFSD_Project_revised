/**
 * Gameunity — Super User Dashboard Logic
 * Full system-level CRUD across all modules.
 */

// ==========================================
// 1. STATE
// ==========================================
let currentPage = 'overview';
let currentUserFilter = 'all';
let currentCommFilter = 'all';
let currentReportFilter = 'all';
let userSearchQuery = '';
let commSearchQuery = '';
let modalAction = null;
let toastTimer;

// ==========================================
// 2. AUTH CHECK
// ==========================================
(function checkAuth() {
    const user = JSON.parse(localStorage.getItem('nexus_user'));
    if (!user || (user.role !== 'superuser' && user.role !== 'admin')) {
        window.location.href = 'login.html';
        return;
    }
    const usernameEl = document.getElementById('su-username');
    if (usernameEl) usernameEl.textContent = user.username || 'Super Admin';
})();

// ==========================================
// 3. NAVIGATION
// ==========================================
window.navTo = function(page, el) {
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#suSubSidebar .nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');

    const titles = { overview: 'System Overview', users: 'User Management', communities: 'Communities', moderation: 'Moderation', 'events-mgmt': 'Events Management', audit: 'Audit Log', config: 'Platform Configuration' };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Re-render on nav
    if (page === 'overview') renderOverview();
    if (page === 'users') renderUsers();
    if (page === 'communities') renderCommunities();
    if (page === 'moderation') renderReports();
    if (page === 'events-mgmt') renderEvents();
    if (page === 'audit') renderAuditFull();
    if (page === 'config') renderConfig();

    if (window.innerWidth <= 900) window.closeSuSidebarDrawer?.();
};

// ==========================================
// 4. OVERVIEW
// ==========================================
function renderOverview() {
    const users = NexusCRUD.getAll('users');
    const comms = NexusCRUD.getAll('communities');
    const reports = NexusCRUD.getWhere('reports', r => r.status === 'pending' || r.status === 'review');
    const events = NexusCRUD.getWhere('events', e => e.status === 'upcoming');
    const auditLog = NexusCRUD.getAll('auditLog');

    document.getElementById('sv-users').textContent = users.length;
    document.getElementById('sv-comms').textContent = comms.length;
    document.getElementById('sv-reports').textContent = reports.length;
    document.getElementById('sv-events').textContent = events.length;

    // Recent audit
    const recentAudit = auditLog.slice(-5).reverse();
    const auditEl = document.getElementById('recent-audit');
    auditEl.innerHTML = recentAudit.map(a => {
        const dotClass = a.action.includes('Ban') ? 'ban' : a.action.includes('Warn') ? 'warn' : a.action.includes('Mute') ? 'mute' : 'create';
        return `<div class="audit-item">
            <div class="audit-dot ${dotClass}"></div>
            <div class="audit-info">
                <div class="audit-action">${esc(a.action)}: ${esc(a.target)}</div>
                <div class="audit-meta">by ${esc(a.moderator)} • ${esc(a.reason)}</div>
            </div>
            <div class="audit-time">${formatTime(a.timestamp)}</div>
        </div>`;
    }).join('') || '<div class="empty-state"><div class="empty-state-text">No audit entries yet</div></div>';

    // Health
    const config = NexusCRUD.getAll('platformConfig') || NexusData.getStore().platformConfig;
    const accuracy = (typeof config === 'object' && !Array.isArray(config)) ? config.autoModAccuracy : 97.3;
    document.getElementById('automod-accuracy').textContent = accuracy + '%';
    document.getElementById('health-reports').textContent = reports.length;
}

// ==========================================
// 5. USERS — FULL CRUD
// ==========================================
function renderUsers() {
    let users = NexusCRUD.getAll('users');

    // Filter
    if (currentUserFilter !== 'all') {
        users = users.filter(u => u.status === currentUserFilter);
    }

    // Search
    if (userSearchQuery) {
        const q = userSearchQuery.toLowerCase();
        users = users.filter(u => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td><div class="row-cell">
                <div class="row-avatar" style="background:${u.bg}">${esc(u.avatar)}</div>
                <div><div class="row-name">${esc(u.name)}</div><div class="row-sub">@${esc(u.handle)}</div></div>
            </div></td>
            <td>${esc(u.email)}</td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td>${esc(u.joined)}</td>
            <td><span class="badge badge-${u.status}">${u.status}</span></td>
            <td><div class="btn-row">
                <button class="act-btn act-edit" onclick="openEditUserModal('${u.id}')">Edit</button>
                ${u.status === 'banned' ? `<button class="act-btn act-restore" onclick="restoreUser('${u.id}')">Restore</button>` : `<button class="act-btn act-ban" onclick="banUser('${u.id}')">Ban</button>`}
                <button class="act-btn act-delete" onclick="deleteUser('${u.id}')">Delete</button>
            </div></td>
        </tr>`).join('');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">No users found</div></div></td></tr>';
    }

    document.getElementById('users-count').textContent = `Showing ${users.length} users`;
}

window.filterUsers = function(filter, el) {
    currentUserFilter = filter;
    document.querySelectorAll('#page-users .filter-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    renderUsers();
};

window.searchUsers = function(query) {
    userSearchQuery = query;
    renderUsers();
};

window.openAddUserModal = function() {
    modalAction = 'addUser';
    document.getElementById('modal-title').textContent = 'Add New User';
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="m-name" placeholder="Enter full name"/></div>
        <div class="form-group"><label class="form-label">Handle</label><input class="form-input" id="m-handle" placeholder="e.g. johndoe"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="m-email" type="email" placeholder="user@example.com"/></div>
        <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="m-role">
            <option value="gamer">Gamer</option><option value="audience">Audience</option><option value="manager">Community Manager</option><option value="mod">Moderator</option><option value="admin">Admin</option><option value="superuser">Super User</option>
        </select></div>`;
    document.getElementById('modal-confirm').textContent = 'Create User';
    document.getElementById('modal').style.display = 'flex';
};

window.openEditUserModal = function(userId) {
    const user = NexusCRUD.getById('users', userId);
    if (!user) return;
    modalAction = 'editUser:' + userId;
    document.getElementById('modal-title').textContent = 'Edit User — ' + user.name;
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="m-name" value="${esc(user.name)}"/></div>
        <div class="form-group"><label class="form-label">Handle</label><input class="form-input" id="m-handle" value="${esc(user.handle)}"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="m-email" type="email" value="${esc(user.email)}"/></div>
        <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="m-role">
            <option value="gamer" ${user.role==='gamer'?'selected':''}>Gamer</option>
            <option value="audience" ${user.role==='audience'?'selected':''}>Audience</option>
            <option value="manager" ${user.role==='manager'?'selected':''}>Community Manager</option>
            <option value="mod" ${user.role==='mod'?'selected':''}>Moderator</option>
            <option value="admin" ${user.role==='admin'?'selected':''}>Admin</option>
            <option value="superuser" ${user.role==='superuser'?'selected':''}>Super User</option>
        </select></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-input" id="m-status">
            <option value="active" ${user.status==='active'?'selected':''}>Active</option>
            <option value="warned" ${user.status==='warned'?'selected':''}>Warned</option>
            <option value="banned" ${user.status==='banned'?'selected':''}>Banned</option>
        </select></div>`;
    document.getElementById('modal-confirm').textContent = 'Save Changes';
    document.getElementById('modal').style.display = 'flex';
};

window.banUser = function(userId) {
    const user = NexusCRUD.getById('users', userId);
    if (!user) return;
    NexusCRUD.update('users', userId, { status: 'banned', bans: (user.bans || 0) + 1 });
    NexusCRUD.logAction({ action: 'User Banned', target: user.name, moderator: 'Super Admin', reason: 'Banned by Super User', community: 'Platform' });
    toast('🚫 ' + user.name + ' has been banned');
    renderUsers();
};

window.restoreUser = function(userId) {
    const user = NexusCRUD.getById('users', userId);
    if (!user) return;
    NexusCRUD.update('users', userId, { status: 'active' });
    NexusCRUD.logAction({ action: 'User Restored', target: user.name, moderator: 'Super Admin', reason: 'Restored by Super User', community: 'Platform' });
    toast('✅ ' + user.name + ' has been restored');
    renderUsers();
};

window.deleteUser = function(userId) {
    const user = NexusCRUD.getById('users', userId);
    if (!user) return;
    if (!confirm('Are you sure you want to delete ' + user.name + '? This cannot be undone.')) return;
    NexusCRUD.remove('users', userId);
    NexusCRUD.logAction({ action: 'User Deleted', target: user.name, moderator: 'Super Admin', reason: 'Deleted by Super User', community: 'Platform' });
    toast('🗑️ ' + user.name + ' has been deleted');
    renderUsers();
};

// ==========================================
// 6. COMMUNITIES — FULL CRUD
// ==========================================
function renderCommunities() {
    let comms = NexusCRUD.getAll('communities');

    if (currentCommFilter !== 'all') {
        comms = comms.filter(c => c.category === currentCommFilter);
    }

    if (commSearchQuery) {
        const q = commSearchQuery.toLowerCase();
        comms = comms.filter(c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }

    const grid = document.getElementById('comm-grid');
    grid.innerHTML = comms.map(c => `
        <div class="comm-card">
            <div class="comm-card-top">
                <div class="comm-icon">${c.icon}</div>
                <div><div class="comm-card-name">${esc(c.name)}</div><div class="comm-card-cat">${esc(c.category)}</div></div>
            </div>
            <div class="comm-card-desc">${esc(c.description)}</div>
            <div class="comm-card-footer">
                <span class="comm-members">👥 ${c.members?.toLocaleString() || 0} members</span>
                <div class="btn-row">
                    <button class="act-btn act-edit" onclick="openEditCommModal('${c.id}')">Edit</button>
                    <button class="act-btn act-delete" onclick="deleteCommunity('${c.id}')">Delete</button>
                </div>
            </div>
        </div>`).join('');

    if (comms.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏘️</div><div class="empty-state-text">No communities found</div><div class="empty-state-sub">Create your first community to get started</div></div>';
    }
}

window.filterComms = function(filter, el) {
    currentCommFilter = filter;
    document.querySelectorAll('#page-communities .filter-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    renderCommunities();
};

window.searchComms = function(query) {
    commSearchQuery = query;
    renderCommunities();
};

window.openAddCommModal = function() {
    modalAction = 'addComm';
    document.getElementById('modal-title').textContent = 'Create Community';
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Community Name</label><input class="form-input" id="m-name" placeholder="e.g. Pro Gamers"/></div>
        <div class="form-group"><label class="form-label">Icon (emoji)</label><input class="form-input" id="m-icon" placeholder="e.g. ⚡" maxlength="2"/></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="m-desc" placeholder="Brief description"/></div>
        <div class="form-group"><label class="form-label">Category</label><select class="form-input" id="m-cat">
            <option value="Gaming">Gaming</option><option value="Design">Design</option><option value="Gaming">Gaming</option><option value="Education">Education</option><option value="Events">Events</option>
        </select></div>
        <div class="form-group"><label class="form-label">Privacy</label><select class="form-input" id="m-privacy">
            <option value="public">Public</option><option value="private">Private</option>
        </select></div>`;
    document.getElementById('modal-confirm').textContent = 'Create Community';
    document.getElementById('modal').style.display = 'flex';
};

window.openEditCommModal = function(commId) {
    const comm = NexusCRUD.getById('communities', commId);
    if (!comm) return;
    modalAction = 'editComm:' + commId;
    document.getElementById('modal-title').textContent = 'Edit Community — ' + comm.name;
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Community Name</label><input class="form-input" id="m-name" value="${esc(comm.name)}"/></div>
        <div class="form-group"><label class="form-label">Icon</label><input class="form-input" id="m-icon" value="${comm.icon}" maxlength="2"/></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="m-desc" value="${esc(comm.description)}"/></div>
        <div class="form-group"><label class="form-label">Category</label><select class="form-input" id="m-cat">
            <option value="Gaming" ${comm.category==='Gaming'?'selected':''}>Gaming</option>
            <option value="Design" ${comm.category==='Design'?'selected':''}>Design</option>
            <option value="Gaming" ${comm.category==='Gaming'?'selected':''}>Gaming</option>
            <option value="Education" ${comm.category==='Education'?'selected':''}>Education</option>
        </select></div>`;
    document.getElementById('modal-confirm').textContent = 'Save Changes';
    document.getElementById('modal').style.display = 'flex';
};

window.deleteCommunity = function(commId) {
    const comm = NexusCRUD.getById('communities', commId);
    if (!comm) return;
    if (!confirm('Delete community "' + comm.name + '"? This cannot be undone.')) return;
    NexusCRUD.remove('communities', commId);
    NexusCRUD.logAction({ action: 'Community Deleted', target: comm.name, moderator: 'Super Admin', reason: 'Deleted by Super User', community: comm.name });
    toast('🗑️ Community "' + comm.name + '" deleted');
    renderCommunities();
};

// ==========================================
// 7. MODERATION
// ==========================================
function renderReports() {
    let reports = NexusCRUD.getAll('reports');
    if (currentReportFilter !== 'all') {
        reports = reports.filter(r => r.status === currentReportFilter);
    }

    const tbody = document.getElementById('reports-tbody');
    tbody.innerHTML = reports.map(r => {
        const user = NexusCRUD.getById('users', r.userId);
        return `<tr>
            <td><strong>${esc(r.reportId)}</strong></td>
            <td>${user ? esc(user.name) : 'Unknown'}</td>
            <td>${r.reasonIcon} ${esc(r.reason)}</td>
            <td><span class="badge badge-${r.status}">${r.status}</span></td>
            <td>${formatTime(r.createdAt)}</td>
            <td><div class="btn-row">
                ${r.status!=='resolved'?`<button class="act-btn act-view" onclick="resolveReport('${r.id}')">Resolve</button>`:''}
                <button class="act-btn act-delete" onclick="deleteReport('${r.id}')">Delete</button>
            </div></td>
        </tr>`;
    }).join('');

    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🛡️</div><div class="empty-state-text">All clear — no reports</div></div></td></tr>';
    }
}

window.filterReports = function(filter, el) {
    currentReportFilter = filter;
    document.querySelectorAll('#page-moderation .filter-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    renderReports();
};

window.resolveReport = function(reportId) {
    NexusCRUD.update('reports', reportId, { status: 'resolved' });
    NexusCRUD.logAction({ action: 'Report Resolved', target: reportId, moderator: 'Super Admin', reason: 'Resolved by Super User', community: 'Platform' });
    toast('✅ Report resolved');
    renderReports();
};

window.deleteReport = function(reportId) {
    NexusCRUD.remove('reports', reportId);
    toast('🗑️ Report deleted');
    renderReports();
};

// ==========================================
// 8. EVENTS — FULL CRUD
// ==========================================
function renderEvents() {
    const events = NexusCRUD.getAll('events');
    const grid = document.getElementById('events-grid');

    grid.innerHTML = events.map(e => `
        <div class="event-card">
            <div class="event-type ${e.type}">${e.type}</div>
            <div class="event-title">${esc(e.title)}</div>
            <div class="event-date">📅 ${e.date} · ${e.time}</div>
            <div class="event-desc">${esc(e.description)}</div>
            <div class="event-footer">
                <span class="event-attendees">👥 ${e.attendees}/${e.maxAttendees}</span>
                <div class="btn-row">
                    <button class="act-btn act-edit" onclick="openEditEventModal('${e.id}')">Edit</button>
                    <button class="act-btn act-delete" onclick="deleteEvent('${e.id}')">Delete</button>
                </div>
            </div>
        </div>`).join('');

    if (events.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">No events yet</div><div class="empty-state-sub">Create your first event</div></div>';
    }
}

window.openAddEventModal = function() {
    modalAction = 'addEvent';
    document.getElementById('modal-title').textContent = 'Create Event';
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Event Title</label><input class="form-input" id="m-title" placeholder="e.g. frontend Hackathon"/></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="m-date" type="date"/></div>
        <div class="form-group"><label class="form-label">Time</label><input class="form-input" id="m-time" type="time"/></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="m-desc" placeholder="Event description"/></div>
        <div class="form-group"><label class="form-label">Type</label><select class="form-input" id="m-type">
            <option value="hackathon">Hackathon</option><option value="workshop">Workshop</option><option value="meetup">Meetup</option><option value="tournament">Tournament</option><option value="watchparty">Watchparty</option>
        </select></div>
        <div class="form-group"><label class="form-label">Max Attendees</label><input class="form-input" id="m-max" type="number" value="100"/></div>`;
    document.getElementById('modal-confirm').textContent = 'Create Event';
    document.getElementById('modal').style.display = 'flex';
};

window.openEditEventModal = function(eventId) {
    const ev = NexusCRUD.getById('events', eventId);
    if (!ev) return;
    modalAction = 'editEvent:' + eventId;
    document.getElementById('modal-title').textContent = 'Edit Event — ' + ev.title;
    document.getElementById('modal-body').innerHTML = `
        <div class="form-group"><label class="form-label">Title</label><input class="form-input" id="m-title" value="${esc(ev.title)}"/></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="m-date" type="date" value="${ev.date}"/></div>
        <div class="form-group"><label class="form-label">Time</label><input class="form-input" id="m-time" value="${ev.time}"/></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="m-desc" value="${esc(ev.description)}"/></div>
        <div class="form-group"><label class="form-label">Type</label><select class="form-input" id="m-type">
            <option value="hackathon" ${ev.type==='hackathon'?'selected':''}>Hackathon</option><option value="workshop" ${ev.type==='workshop'?'selected':''}>Workshop</option><option value="meetup" ${ev.type==='meetup'?'selected':''}>Meetup</option><option value="tournament" ${ev.type==='tournament'?'selected':''}>Tournament</option>
        </select></div>
        <div class="form-group"><label class="form-label">Max Attendees</label><input class="form-input" id="m-max" type="number" value="${ev.maxAttendees}"/></div>`;
    document.getElementById('modal-confirm').textContent = 'Save Changes';
    document.getElementById('modal').style.display = 'flex';
};

window.deleteEvent = function(eventId) {
    const ev = NexusCRUD.getById('events', eventId);
    if (!ev) return;
    if (!confirm('Delete event "' + ev.title + '"?')) return;
    NexusCRUD.remove('events', eventId);
    toast('🗑️ Event deleted');
    renderEvents();
};

// ==========================================
// 9. AUDIT LOG
// ==========================================
function renderAuditFull() {
    const audit = NexusCRUD.getAll('auditLog').slice().reverse();
    const tbody = document.getElementById('audit-tbody');

    tbody.innerHTML = audit.map(a => `
        <tr>
            <td><strong>${esc(a.action)}</strong></td>
            <td>${esc(a.target)}</td>
            <td>${esc(a.moderator)}</td>
            <td>${esc(a.reason)}</td>
            <td>${esc(a.community)}</td>
            <td>${formatTime(a.timestamp)}</td>
        </tr>`).join('');

    if (audit.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No audit entries</div></div></td></tr>';
    }
}

// ==========================================
// 10. PLATFORM CONFIG
// ==========================================
function renderConfig() {
    const store = NexusData.getStore();
    const config = store.platformConfig || {};

    const autoModEl = document.getElementById('cfg-automod');
    const regEl = document.getElementById('cfg-registration');
    const maxCommEl = document.getElementById('cfg-maxcomm');
    const maxChEl = document.getElementById('cfg-maxch');

    if (autoModEl) autoModEl.checked = config.autoModEnabled !== false;
    if (regEl) regEl.checked = config.allowPublicRegistration !== false;
    if (maxCommEl) maxCommEl.value = config.maxCommunitiesPerUser || 10;
    if (maxChEl) maxChEl.value = config.maxChannelsPerCommunity || 50;

    // Policies
    const policiesList = document.getElementById('policies-list');
    const policies = config.moderationPolicies || [];
    policiesList.innerHTML = policies.map((p, i) => `
        <div class="policy-item">
            <span>📌 ${esc(p)}</span>
            <button class="policy-del" onclick="removePolicy(${i})">✕</button>
        </div>`).join('');
}

window.updateConfig = function(key, value) {
    const store = NexusData.getStore();
    if (!store.platformConfig) store.platformConfig = {};
    store.platformConfig[key] = value;
    NexusData.saveStore(store);
    toast('⚙️ Configuration updated');
};

window.addPolicy = function() {
    const input = document.getElementById('new-policy');
    const val = input.value.trim();
    if (!val) return;

    const store = NexusData.getStore();
    if (!store.platformConfig.moderationPolicies) store.platformConfig.moderationPolicies = [];
    store.platformConfig.moderationPolicies.push(val);
    NexusData.saveStore(store);
    input.value = '';
    toast('📌 Policy added');
    renderConfig();
};

window.removePolicy = function(index) {
    const store = NexusData.getStore();
    store.platformConfig.moderationPolicies.splice(index, 1);
    NexusData.saveStore(store);
    toast('🗑️ Policy removed');
    renderConfig();
};

// ==========================================
// 11. MODAL HANDLER
// ==========================================
window.confirmModal = function() {
    if (!modalAction) return;

    const name = document.getElementById('m-name')?.value?.trim();

    // Validate required fields
    if (window.NexusValidator && (modalAction.startsWith('add') || modalAction.startsWith('edit'))) {
        let valid = true;
        const rules = [];
        
        if (modalAction.includes('User') || modalAction.includes('Comm')) {
            const nameEl = document.getElementById('m-name');
            if (nameEl) rules.push({ element: nameEl, validators: [{ check: v => window.NexusValidator.isRequired(v), message: 'Name is required' }, { check: v => window.NexusValidator.minLength(v, 2), message: 'Min 2 characters' }]});
        }
        
        if (modalAction.includes('User')) {
            const emailEl = document.getElementById('m-email');
            if (emailEl && emailEl.value) rules.push({ element: emailEl, validators: [{ check: v => window.NexusValidator.isEmail(v), message: 'Invalid email' }]});
        }
        
        if (modalAction.includes('Event')) {
            const titleEl = document.getElementById('m-title');
            if (titleEl) rules.push({ element: titleEl, validators: [{ check: v => window.NexusValidator.isRequired(v), message: 'Title is required' }]});
        }
        
        if (rules.length > 0) valid = window.NexusValidator.validateForm(rules);
        
        if (!valid) {
            toast('⚠️ Please fix the validation errors below');
            return;
        }
    } else {
        // Fallback validation
        if (modalAction.startsWith('add') || modalAction.startsWith('edit')) {
            if (modalAction.includes('User') || modalAction.includes('Comm')) {
                if (!name) { toast('⚠️ Name is required'); return; }
            }
            if (modalAction.includes('Event')) {
                const title = document.getElementById('m-title')?.value?.trim();
                if (!title) { toast('⚠️ Title is required'); return; }
            }
        }
    }

    if (modalAction === 'addUser') {
        const initials = (name || 'NU').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        NexusCRUD.create('users', {
            name, handle: document.getElementById('m-handle')?.value?.trim() || name.toLowerCase().replace(/\s/g,''),
            email: document.getElementById('m-email')?.value?.trim() || '',
            role: document.getElementById('m-role')?.value || 'gamer',
            avatar: initials, bg: 'linear-gradient(135deg,#5B6EF5,#8B5CF6)',
            status: 'active', joined: new Date().toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}),
            communities: 0, warnings: 0, bans: 0, violations: 0
        });
        NexusCRUD.logAction({ action: 'User Created', target: name, moderator: 'Super Admin', reason: 'Created by Super User', community: 'Platform' });
        toast('✅ User "' + name + '" created');
        renderUsers();
    }

    if (modalAction.startsWith('editUser:')) {
        const userId = modalAction.split(':')[1];
        NexusCRUD.update('users', userId, {
            name, handle: document.getElementById('m-handle')?.value?.trim(),
            email: document.getElementById('m-email')?.value?.trim(),
            role: document.getElementById('m-role')?.value,
            status: document.getElementById('m-status')?.value
        });
        toast('✅ User updated');
        renderUsers();
    }

    if (modalAction === 'addComm') {
        NexusCRUD.create('communities', {
            name, icon: document.getElementById('m-icon')?.value || '🏠',
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description: document.getElementById('m-desc')?.value?.trim() || '',
            category: document.getElementById('m-cat')?.value || 'Gaming',
            privacy: document.getElementById('m-privacy')?.value || 'public',
            members: 0, status: 'active', createdBy: 'u9'
        });
        NexusCRUD.logAction({ action: 'Community Created', target: name, moderator: 'Super Admin', reason: 'Created by Super User', community: name });
        toast('✅ Community "' + name + '" created');
        renderCommunities();
    }

    if (modalAction.startsWith('editComm:')) {
        const commId = modalAction.split(':')[1];
        NexusCRUD.update('communities', commId, {
            name, icon: document.getElementById('m-icon')?.value,
            description: document.getElementById('m-desc')?.value?.trim(),
            category: document.getElementById('m-cat')?.value
        });
        toast('✅ Community updated');
        renderCommunities();
    }

    if (modalAction === 'addEvent') {
        const title = document.getElementById('m-title')?.value?.trim();
        NexusCRUD.create('events', {
            title, date: document.getElementById('m-date')?.value, time: document.getElementById('m-time')?.value,
            description: document.getElementById('m-desc')?.value?.trim() || '',
            type: document.getElementById('m-type')?.value || 'meetup',
            attendees: 0, maxAttendees: parseInt(document.getElementById('m-max')?.value) || 100,
            status: 'upcoming', createdBy: 'u9'
        });
        toast('✅ Event "' + title + '" created');
        renderEvents();
    }

    if (modalAction.startsWith('editEvent:')) {
        const eventId = modalAction.split(':')[1];
        NexusCRUD.update('events', eventId, {
            title: document.getElementById('m-title')?.value?.trim(),
            date: document.getElementById('m-date')?.value, time: document.getElementById('m-time')?.value,
            description: document.getElementById('m-desc')?.value?.trim(),
            type: document.getElementById('m-type')?.value,
            maxAttendees: parseInt(document.getElementById('m-max')?.value) || 100
        });
        toast('✅ Event updated');
        renderEvents();
    }

    closeModal();
};

window.closeModal = function() {
    document.getElementById('modal').style.display = 'none';
    modalAction = null;
};

// Click outside to close
document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// ==========================================
// 12. GLOBAL SEARCH
// ==========================================
window.handleGlobalSearch = function(query) {
    // Search across all sections
    if (!query.trim()) return;
    const q = query.toLowerCase();

    // Check if searching for users
    const userMatch = NexusCRUD.search('users', q, ['name', 'handle', 'email']);
    if (userMatch.length > 0) {
        navTo('users', document.querySelector('[onclick*="users"]'));
        userSearchQuery = q;
        document.querySelector('#page-users .search-input').value = q;
        renderUsers();
        return;
    }

    // Check communities
    const commMatch = NexusCRUD.search('communities', q, ['name', 'category']);
    if (commMatch.length > 0) {
        navTo('communities', document.querySelector('[onclick*="communities"]'));
        commSearchQuery = q;
        renderCommunities();
    }
};

// ==========================================
// 13. LOGOUT
// ==========================================
window.handleLogout = function() {
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_owned_communities');
    window.location.href = 'landing.html';
};

// ==========================================
// 14. UTILITIES
// ==========================================
function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toast(msg) {
    const t = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const txt = document.getElementById('toastMsg');
    if (!t) return;

    const parts = msg.match(/^(\S+)\s(.+)$/);
    if (parts) { icon.textContent = parts[1]; txt.textContent = parts[2]; }
    else { icon.textContent = '✅'; txt.textContent = msg; }

    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ==========================================
// 15. INIT
// ==========================================
// ==========================================
// 16. SUB-SIDEBAR (collapse, sections, drawer)
// ==========================================
const SU_SIDEBAR_LS = 'su_subsidebar_collapsed';
const SU_SECTION_LS_PREFIX = 'su_nav_sec_';

function applySuSidebarCollapsed(collapsed) {
    const aside = document.getElementById('suSubSidebar');
    const btn = document.getElementById('suNavCollapseBtn');
    if (!aside) return;
    aside.classList.toggle('is-collapsed', collapsed);
    aside.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
    if (btn) {
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        btn.title = collapsed ? 'Expand panel' : 'Collapse panel';
        btn.setAttribute('aria-label', collapsed ? 'Expand navigation panel' : 'Collapse navigation panel');
    }
    try {
        localStorage.setItem(SU_SIDEBAR_LS, collapsed ? '1' : '0');
    } catch (e) { /* ignore */ }
}

window.toggleSuNavPanel = function() {
    const aside = document.getElementById('suSubSidebar');
    if (!aside) return;
    applySuSidebarCollapsed(!aside.classList.contains('is-collapsed'));
};

window.toggleSuNavSection = function(headBtn) {
    const section = headBtn.closest('.su-nav-section');
    if (!section || asideIsCollapsed()) return;
    const nowClosed = section.classList.toggle('is-closed');
    headBtn.setAttribute('aria-expanded', nowClosed ? 'false' : 'true');
    const key = section.getAttribute('data-section');
    if (key) {
        try {
            localStorage.setItem(SU_SECTION_LS_PREFIX + key, nowClosed ? '0' : '1');
        } catch (e) { /* ignore */ }
    }
};

function asideIsCollapsed() {
    const aside = document.getElementById('suSubSidebar');
    if (!aside || !aside.classList.contains('is-collapsed')) return false;
    if (window.innerWidth <= 900 && aside.classList.contains('su-drawer-open')) return false;
    return true;
}

function initSuSidebarFromStorage() {
    let collapsed = false;
    try {
        collapsed = localStorage.getItem(SU_SIDEBAR_LS) === '1';
    } catch (e) { /* ignore */ }
    applySuSidebarCollapsed(collapsed);

    document.querySelectorAll('.su-nav-section[data-section]').forEach(section => {
        const key = section.getAttribute('data-section');
        let open = true;
        try {
            const v = localStorage.getItem(SU_SECTION_LS_PREFIX + key);
            if (v === '0') open = false;
        } catch (e) { /* ignore */ }
        section.classList.toggle('is-closed', !open);
        const head = section.querySelector('.su-nav-section-head');
        if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
}

window.openSuSidebarDrawer = function() {
    const aside = document.getElementById('suSubSidebar');
    const backdrop = document.getElementById('suNavBackdrop');
    if (!aside) return;
    aside.classList.add('su-drawer-open');
    if (backdrop) backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('su-nav-drawer-active');
};

window.closeSuSidebarDrawer = function() {
    const aside = document.getElementById('suSubSidebar');
    const backdrop = document.getElementById('suNavBackdrop');
    if (aside) aside.classList.remove('su-drawer-open');
    if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('su-nav-drawer-active');
};

document.addEventListener('DOMContentLoaded', () => {
    initSuSidebarFromStorage();
    const backdrop = document.getElementById('suNavBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeSuSidebarDrawer);
    }
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeSuSidebarDrawer();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSuSidebarDrawer();
    });
    renderOverview();
    console.log('%c[Gameunity] %cSuper User Dashboard loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #F59E0B;');
});
