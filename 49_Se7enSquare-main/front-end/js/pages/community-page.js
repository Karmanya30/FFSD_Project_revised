/**
 * Se7enSquare — Community Page
 * Fetches community data from GET /api/communities/:id and events from GET /api/events
 */

let _comm   = null;
let _events = [];

function getCommunityPageId() {
    return new URLSearchParams(window.location.search).get('id');
}

// ── Load from URL param ───────────────────────────────────────────────────────
async function loadCommunityData() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        // Fallback: load first community
        try {
            const all = await window.API.communities.getAll();
            _comm = all[0] || null;
        } catch (e) { _comm = null; }
    } else {
        try {
            _comm = await window.API.communities.getOne(id);
        } catch (e) {
            console.error('[CommunityPage] Could not load community id:', id, e);
            _comm = null;
        }
    }

    if (_comm) {
        try {
            const all = await window.API.events.getAll();
            _events = all.filter(e =>
                String(e.communityId) === String(_comm.id) &&
                e.status === 'approved'
            );
        } catch (e) { _events = []; }
    }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderCommunityData() {
    if (!_comm) {
        document.body.innerHTML += '<div style="padding:40px;text-align:center;color:var(--text-3)">Community not found.</div>';
        return;
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('comm-icon',         _comm.icon  || '🏘️');
    set('comm-name-title',   _comm.name);
    set('breadcrumbCommunityName', _comm.name);
    set('comm-online-count', (_comm.onlineCount  || 0).toLocaleString());
    set('comm-member-count', (_comm.memberCount  || 0).toLocaleString());
    set('comm-category',     `💻 ${_comm.category || 'Gaming'} · Community`);
    set('comm-description',  _comm.description);
    set('stat-total-members', (_comm.memberCount  || 0).toLocaleString());
    set('stat-online-now',   (_comm.onlineCount  || 0).toLocaleString());

    const bigIcon = document.querySelector('.comm-big-icon');
    if (bigIcon) bigIcon.textContent = _comm.icon || '🏘️';

    document.querySelectorAll('.comm-name-text').forEach(el => el.textContent = _comm.name);

    const founded = document.getElementById('comm-founded');
    if (founded && _comm.createdAt) {
        founded.textContent = `📅 Founded ${new Date(_comm.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }

    // Tags as channels placeholder
    const tabs = document.getElementById('tab-count-channels');
    if (tabs) tabs.textContent = (_comm.tags || []).length;
    const tabMembers = document.getElementById('tab-count-members');
    if (tabMembers) tabMembers.textContent = (_comm.memberCount || 0).toLocaleString();

    renderChannelsFromTags(_comm.tags || []);
    renderCommunityEvents();
    initJoinState(_comm.id);
    initCommunityNavigation(_comm.id);
}

function renderChannelsFromTags(tags) {
    const container = document.getElementById('channelsList');
    if (!container) return;

    if (tags.length === 0) {
        container.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--text-3);">No channels yet.</div>';
        return;
    }

    // Render tags as text channels
    const html = ['<div class="ch-group-title">💬 Text Channels</div>'];
    tags.forEach(tag => {
        html.push(`
            <div class="ch-row" onclick="selectChannel(this, '${tag}', '${tag} discussion')">
                <span class='ch-icon'>#</span>
                <span class='ch-name'>${tag}</span>
            </div>
        `);
    });

    container.innerHTML = html.join('');
    container.querySelector('.ch-row')?.click();
}

function renderCommunityEvents() {
    const container = document.getElementById('activeEventsList');
    if (!container) return;

    if (_events.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px;">No active events yet</div>';
        return;
    }

    container.innerHTML = _events.map(ev => {
        const date  = new Date(ev.date);
        const day   = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });

        return `
            <div class="event-mini" onclick="window.location.href='events.html'">
                <div class="ev-date">
                    <div class="ev-mon">${month}</div>
                    <div class="ev-day">${day}</div>
                </div>
                <div class="ev-info">
                    <div class="ev-name">${ev.title}</div>
                    <div class="ev-meta">${ev.time || '—'} · ${ev.attendees || 0} attending</div>
                </div>
                <span class="ev-badge">${ev.status}</span>
            </div>
        `;
    }).join('');
}

// ── Actions ───────────────────────────────────────────────────────────────────
window.selectChannel = function (row, channelName, description) {
    document.querySelectorAll('.ch-row').forEach(r => r.classList.remove('active-ch'));
    if (row) row.classList.add('active-ch');

    const activeCh     = document.getElementById('activeCh');
    const activeChDesc = document.getElementById('activeChDesc');
    if (activeCh)     activeCh.textContent     = channelName;
    if (activeChDesc) activeChDesc.textContent = description || 'Welcome to the channel!';
};

window.toggleMainJoin = async function () {
    if (!_comm) return;
    const btn = document.getElementById('joinMainBtn');
    let joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const id = String(_comm.id);
    const isJoined = joinedIds.includes(id);
    const userId = JSON.parse(localStorage.getItem('nexus_user') || '{}').id || 3;

    if (isJoined) {
        try {
            const all = await window.API.memberships.getAll();
            const match = all.find(m => String(m.communityId) === id && String(m.userId) === String(userId));
            if (match) await window.API.memberships.delete(match.id);
        } catch (e) { /* ignore */ }
        joinedIds = joinedIds.filter(s => s !== id);
        if (btn) { btn.classList.remove('joined'); btn.textContent = '+ Join Community'; }
        if (window.toast) window.toast('Left community.');
    } else {
        try {
            await window.API.memberships.create({ userId: Number(userId), communityId: Number(_comm.id) });
        } catch (e) { /* duplicate is OK */ }
        joinedIds.push(id);
        if (btn) { btn.classList.add('joined'); btn.textContent = '✓ Joined'; }
        if (window.toast) window.toast(`Welcome to ${_comm.name}! 🚀`);
    }

    localStorage.setItem('nexus_joined_communities', JSON.stringify(joinedIds));
};

function initJoinState(communityId) {
    const btn = document.getElementById('joinMainBtn');
    if (!btn) return;
    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const isJoined = joinedIds.includes(String(communityId));
    if (isJoined) { btn.classList.add('joined'); btn.textContent = '✓ Joined'; }
    else { btn.classList.remove('joined'); btn.textContent = '+ Join Community'; }
}

window.switchTab = function (tabName, btn) {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('tab-' + tabName)?.classList.add('active');
};

function initCommunityNavigation(communityId) {
    const manageBtn = document.getElementById('rbacManageBtn');
    if (manageBtn && communityId) {
        manageBtn.href = `community-settings.html?id=${encodeURIComponent(communityId)}`;
    }
}

window.goBackFromCommunity = function () {
    const referrerPage = document.referrer.split('/').pop();
    const internalReferrer = ['discovery.html', 'dashboard.html', 'events.html'].some(page =>
        referrerPage.startsWith(page)
    );

    if (internalReferrer && window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = 'discovery.html';
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadCommunityData();
    renderCommunityData();
    console.log('%c[CommunityPage] %cLive backend data loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
