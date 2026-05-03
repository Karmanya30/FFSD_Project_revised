/**
 * Se7enSquare — Moderator Review Panel
 * Fetches reports from GET /api/reports and updates via PATCH /api/reports/:id/status
 */

let _reports        = [];
let activeModTab    = 'pending';
let currentReportIdx = 0;
let toastDebounce;

// ── Load reports from backend ─────────────────────────────────────────────────
async function loadReports() {
    try {
        _reports = await window.API.reports.getAll();
    } catch (err) {
        console.error('[ModPanel] Failed to load reports:', err);
        _reports = [];
    }
    // Also merge any frontend-submitted reports stored in localStorage (from report.js)
    const pending = JSON.parse(localStorage.getItem('modPanelNewReports') || '[]');
    // These are legacy local reports; skip them since backend now handles it
    localStorage.removeItem('modPanelNewReports');
}

// ── Map backend status to UI badge ────────────────────────────────────────────
function mapStatus(backendStatus) {
    const map = { pending: 'pending', reviewed: 'review', resolved: 'resolved', escalated: 'escalated' };
    return map[backendStatus] || 'pending';
}

function mapBackendStatus(uiBadge) {
    const map = { pending: 'pending', review: 'reviewed', resolved: 'resolved', escalated: 'escalated' };
    return map[uiBadge] || 'pending';
}

// ── Render queue ──────────────────────────────────────────────────────────────
window.renderQueue = function (searchQuery = '') {
    const listContainer = document.getElementById('queueList');
    if (!listContainer) return [];

    const filtered = _reports.filter(r => {
        const uiBadge     = mapStatus(r.status);
        const matchesTab  = activeModTab === 'pending'
            ? (uiBadge === 'pending' || uiBadge === 'escalated')
            : activeModTab === 'review'
            ? uiBadge === 'review'
            : uiBadge === 'resolved';

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            String(r.targetId).includes(searchLower) ||
            r.reason.toLowerCase().includes(searchLower) ||
            r.targetType.toLowerCase().includes(searchLower);

        return matchesTab && matchesSearch;
    });

    listContainer.innerHTML = filtered.map((report, i) => {
        const globalIdx  = _reports.indexOf(report);
        const isActive   = globalIdx === currentReportIdx;
        const uiBadge    = mapStatus(report.status);
        const initials   = `R${report.id}`;
        const bg         = 'linear-gradient(135deg,#5B6EF5,#8B5CF6)';

        return `
            <div class="report-item ${isActive ? 'active' : ''}"
                 onclick="selectReport(this, ${globalIdx})"
                 style="animation-delay: ${i * 0.03}s">
                <div class="ri-top">
                    <div class="ri-av" style="background: ${bg}">${initials}</div>
                    <span class="ri-name">${report.targetType} #${report.targetId}</span>
                    <span class="ri-time">Report #${report.id}</span>
                </div>
                <div class="ri-reason">${report.reason}</div>
                <div class="ri-bottom">
                    <span class="ri-badge badge-${uiBadge}">${capitalize(uiBadge)}</span>
                    <span class="ri-channel">${report.targetType}</span>
                </div>
            </div>`;
    }).join('');

    updateQueueCounters(filtered.length);
    return filtered;
};

function updateQueueCounters(count) {
    const qCount = document.getElementById('queueCount');
    if (qCount) qCount.textContent = count;
    updateHeaderStats();
}

function updateHeaderStats() {
    const open     = _reports.filter(r => r.status === 'pending').length;
    const inReview = _reports.filter(r => r.status === 'reviewed').length;
    const resolved = _reports.filter(r => r.status === 'resolved').length;

    const openEl = document.getElementById('openCount');
    if (openEl) openEl.textContent = open;

    const stats = document.querySelectorAll('.header-stats .hstat');
    if (stats[1]) stats[1].innerHTML = `<div class="dot u-extracted-178"></div> ${inReview} In Review`;
    if (stats[2]) stats[2].innerHTML = `<div class="dot u-extracted-172"></div> ${resolved} Resolved`;
}

// ── Select & detail panel ────────────────────────────────────────────────────
window.selectReport = function (el, idx) {
    currentReportIdx = idx;
    const r = _reports[idx];
    if (!r) return;

    window.renderQueue();

    const titleEl = document.getElementById('dpTitle');
    if (titleEl) titleEl.textContent = `Report #${r.id} — ${r.targetType} #${r.targetId}`;

    const actionEl = document.getElementById('dpAction');
    if (actionEl) actionEl.textContent = `Status: ${r.status}`;

    syncActionPanel(r);
    window.setDpTab(document.querySelector('.dp-tab'), 'content');
};

function syncActionPanel(report) {
    const elements = {
        'accAvatar':     el => { el.textContent = `#${report.id}`; el.style.background = 'linear-gradient(135deg,#5B6EF5,#8B5CF6)'; },
        'accName':       el => el.textContent = `${report.targetType} #${report.targetId}`,
        'accSub':        el => el.textContent = report.reason,
        'accViolations': el => el.textContent = 1,
        'accDays':       el => el.textContent = '—',
        'accBans':       el => el.textContent = 0,
        'accWarnings':   el => el.textContent = 0,
    };

    for (const [id, fn] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) fn(el);
    }
}

// ── Tab switching ─────────────────────────────────────────────────────────────
window.setQTab = function (el, tab) {
    document.querySelectorAll('.qp-tab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    activeModTab = tab;
    const filtered = window.renderQueue();

    const currentVisible = filtered.some(r => _reports.indexOf(r) === currentReportIdx);
    if (!currentVisible && filtered.length > 0) {
        window.selectReport(null, _reports.indexOf(filtered[0]));
    }
};

window.setDpTab = function (el, tabName) {
    document.querySelectorAll('.dp-tab').forEach(t => t.classList.remove('on'));
    if (el) el.classList.add('on');
    ['tabContent', 'tabHistory', 'tabPrevious'].forEach(id => {
        const tabEl = document.getElementById(id);
        if (tabEl) tabEl.style.display = id.toLowerCase().includes(tabName) ? 'block' : 'none';
    });
};

window.setMute = function (el) {
    document.querySelectorAll('.mute-opt').forEach(o => o.classList.remove('on'));
    el.classList.add('on');
};

// ── Moderation actions ────────────────────────────────────────────────────────
const ACTION_FEEDBACK = {
    warn:    { icon: '⚠️',  msg: 'Warning issued',          newStatus: 'reviewed' },
    mute:    { icon: '🔇',  msg: 'User muted successfully', newStatus: 'reviewed' },
    ban7:    { icon: '🚫',  msg: '7-day ban applied',       newStatus: 'reviewed' },
    banperm: { icon: '⛔',  msg: 'Permanent ban applied',   newStatus: 'reviewed' },
    dismiss: { icon: '✅',  msg: 'Report dismissed',        newStatus: 'resolved' },
    escalate:{ icon: '🔺',  msg: 'Report escalated to Admin', newStatus: 'escalated' },
};

window.takeAction = async function (type) {
    const feedback = ACTION_FEEDBACK[type];
    const report   = _reports[currentReportIdx];
    if (!report) return;

    // Determine the next backend status
    const backendStatus = feedback.newStatus;

    // Only transition if it's a valid move (backend enforces pending → reviewed → resolved)
    try {
        if (backendStatus === 'escalated') {
            await window.API.reports.updateStatus(report.id, 'escalated');
            report.status = 'escalated';
        } else if (report.status === 'pending' && backendStatus === 'reviewed') {
            await window.API.reports.updateStatus(report.id, 'reviewed');
            report.status = 'reviewed';
        } else if (report.status === 'reviewed' && backendStatus === 'resolved') {
            await window.API.reports.updateStatus(report.id, 'resolved');
            report.status = 'resolved';
        } else if (report.status === 'pending' && backendStatus === 'resolved') {
            // Two-step: pending → reviewed → resolved
            await window.API.reports.updateStatus(report.id, 'reviewed');
            await window.API.reports.updateStatus(report.id, 'resolved');
            report.status = 'resolved';
        }
    } catch (err) {
        console.warn('[ModPanel] Status update failed:', err.message);
    }

    window.showToast(feedback.icon, `${feedback.msg} — #${report.id}`);

    const statusEl = document.getElementById('actionStatus');
    if (statusEl) {
        statusEl.textContent = `${feedback.icon} ${feedback.msg}`;
        statusEl.classList.add('action-status-active');
        setTimeout(() => statusEl.classList.remove('action-status-active'), 2000);
    }

    window.renderQueue();
};

window.resolveReport = async function () {
    const report = _reports[currentReportIdx];
    if (!report) { window.showToast('⚠️', 'No report selected.'); return; }

    try {
        if (report.status === 'pending') {
            await window.API.reports.updateStatus(report.id, 'reviewed');
        }
        await window.API.reports.updateStatus(report.id, 'resolved');
        report.status = 'resolved';
        window.showToast('✅', `Report #${report.id} resolved.`);
    } catch (err) {
        window.showToast('⚠️', 'Could not resolve: ' + err.message);
    }

    window.renderQueue();
};

// ── UI utilities ──────────────────────────────────────────────────────────────
window.showToast = function (icon, msg) {
    const t    = document.getElementById('toast');
    const tIcon = document.getElementById('toastIcon');
    const tMsg  = document.getElementById('toastMsg');
    if (!t || !tIcon || !tMsg) return;

    tIcon.textContent = icon;
    tMsg.textContent  = msg;
    t.classList.add('show');
    clearTimeout(toastDebounce);
    toastDebounce = setTimeout(() => t.classList.remove('show'), 2800);
};

window.filterQueue = function (val) { window.renderQueue(val); };

window.switchCommunity = function (el, name, icon) {
    document.querySelectorAll('.comm-item').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    const nameEl = document.getElementById('activeCommName');
    const iconEl = document.getElementById('activeCommIcon');
    if (nameEl) nameEl.textContent = name;
    if (iconEl) iconEl.textContent = icon;
    window.showToast('🏘️', `Switched mod context to ${name}`);
    window.renderQueue();
};

window.toggleModSidebar = function () {
    const sidebar = document.querySelector('.mod-sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
};

function capitalize(s) {
    if (s === 'review') return 'In Review';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    const keyMap = { w: 'warn', m: 'mute', b: 'ban7', p: 'banperm', d: 'dismiss', e: 'escalate' };
    const action = keyMap[e.key.toLowerCase()];
    if (action) { e.preventDefault(); window.takeAction(action); }
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof requireRole === 'function' && !requireRole(['moderator', 'admin'])) return;
    await loadReports();
    window.renderQueue();

    if (_reports.length > 0) window.selectReport(null, 0);

    const isCollapsed = localStorage.getItem('modSidebarCollapsed') === 'true';
    if (isCollapsed) document.querySelector('.mod-sidebar')?.classList.add('collapsed');

    console.log('%c[ModPanel] %cLive reports loaded from backend.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
