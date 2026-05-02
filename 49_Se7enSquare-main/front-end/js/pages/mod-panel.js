import { api } from '../core/api.js';

// ==========================================
// 1. DATA & STATE
// ==========================================
let REPORTS_DATA = [];

let activeModTab = 'pending';
let currentReportIdx = 0;
let toastDebounce;

async function fetchReports() {
  const response = await api.get('/reports');
  if (response && Array.isArray(response)) {
    REPORTS_DATA = response.map(r => ({
      id: `#${r.id}`,
      backendId: r.id,
      user: `User_${r.targetId}`,
      av: 'U',
      bg: 'linear-gradient(135deg,#6366f1,#4f46e5)',
      channel: `#${r.targetType}`,
      reason: r.reason,
      badge: r.status,
      time: 'Just now',
      violations: 1,
      days: 30,
      bans: 0,
      warnings: 0,
      sub: 'Member since 2026',
      unread: true
    }));
    window.renderQueue();
  }
}

fetchReports();

// ==========================================
// 2. QUEUE ENGINE
// ==========================================

window.renderQueue = function(searchQuery = '') {
    const listContainer = document.getElementById('queueList');
    if (!listContainer) return;

    const filtered = REPORTS_DATA.filter(report => {
        const matchesTab = activeModTab === 'pending' ? (report.badge === 'pending' || report.badge === 'escalated')
                         : activeModTab === 'review'  ? report.badge === 'review'
                         : report.badge === 'resolved';

        const matchesSearch = !searchQuery ||
                             report.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             report.channel.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    listContainer.innerHTML = filtered.map((report, i) => {
        const globalIdx = REPORTS_DATA.indexOf(report);
        const isActive = globalIdx === currentReportIdx;

        return `
            <div class="report-item ${isActive ? 'active' : ''}"
                 onclick="selectReport(this, ${globalIdx})"
                 style="animation-delay: ${i * 0.03}s">
                ${report.unread ? '<div class="ri-unread-dot"></div>' : ''}
                <div class="ri-top">
                    <div class="ri-av" style="background: ${report.bg}">${report.av}</div>
                    <span class="ri-name">${report.user}</span>
                    <span class="ri-time">${report.time}</span>
                </div>
                <div class="ri-reason">${report.reason}</div>
                <div class="ri-bottom">
                    <span class="ri-badge badge-${report.badge}">
                        ${capitalize(report.badge)}
                    </span>
                    ${report.repeat ? `<span class="repeat-badge">${report.repeat}</span>` : ''}
                    <span class="ri-channel">${report.channel}</span>
                    <span class="ri-action">${report.action ? report.action : 'No action yet'}</span>
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
    const openCountEl = document.getElementById('openCount');
    const inReviewEl = document.querySelector('.header-stats .hstat:nth-child(2)');
    const resolvedEl = document.querySelector('.header-stats .hstat:nth-child(3)');

    const openCount = REPORTS_DATA.filter(r => r.badge === 'pending' || r.badge === 'escalated').length;
    const inReviewCount = REPORTS_DATA.filter(r => r.badge === 'review').length;
    const resolvedCount = REPORTS_DATA.filter(r => r.badge === 'resolved').length;

    if (openCountEl) openCountEl.textContent = openCount;
    if (inReviewEl) inReviewEl.innerHTML = `<div class="dot u-extracted-178"></div> ${inReviewCount} In Review`;
    if (resolvedEl) resolvedEl.innerHTML = `<div class="dot u-extracted-172"></div> ${resolvedCount} Resolved`;
}

// ==========================================
// 3. DETAIL & ACTION PANELS
// ==========================================

window.selectReport = function(el, idx) {
    currentReportIdx = idx;
    const r = REPORTS_DATA[idx];

    // Mark as read
    r.unread = false;
    window.renderQueue();

    // Update Detail Header
    const titleEl = document.getElementById('dpTitle');
    if (titleEl) titleEl.textContent = `Report ${r.id} — ${r.user} in ${r.channel}`;

    const actionEl = document.getElementById('dpAction');
    if (actionEl) {
        actionEl.textContent = `Last action: ${r.action || 'None'}`;
        actionEl.classList.toggle('updated', !!r.action && r.action !== 'None');
    }

    // Update Accused User Mini-Profile
    syncActionPanel(r);

    // Default to 'Content' tab
    window.setDpTab(document.querySelector('.dp-tab'), 'content');
};

function syncActionPanel(report) {
    const elements = {
        'accAvatar': el => { el.textContent = report.av; el.style.background = report.bg; },
        'accName': el => el.textContent = report.user,
        'accSub': el => el.textContent = report.sub,
        'accViolations': el => el.textContent = report.violations,
        'accDays': el => el.textContent = report.days,
        'accBans': el => el.textContent = report.bans,
        'accWarnings': el => el.textContent = report.warnings
    };

    for (const [id, updateFn] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) updateFn(el);
    }

    const rw = document.getElementById('repeatWarning');
    if (rw) {
        if (report.violations >= 2) {
            rw.style.display = 'flex';
            rw.textContent = `⚠️ Repeat offender — ${report.violations} violations. ${report.violations >= 3 ? 'Escalated action recommended.' : 'Check history.'}`;
        } else {
            rw.style.display = 'none';
        }
    }
}

window.setQTab = function(el, tab) {
    document.querySelectorAll('.qp-tab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    activeModTab = tab;
    const filtered = window.renderQueue();

    const currentVisible = filtered.some(report => REPORTS_DATA.indexOf(report) === currentReportIdx);
    if (!currentVisible && filtered.length > 0) {
        const nextIdx = REPORTS_DATA.indexOf(filtered[0]);
        if (nextIdx !== -1) {
            window.selectReport(null, nextIdx);
        }
    }
};

window.setDpTab = function(el, tabName) {
    document.querySelectorAll('.dp-tab').forEach(t => t.classList.remove('on'));
    if (el) el.classList.add('on');

    const tabs = ['tabContent', 'tabHistory', 'tabPrevious'];
    tabs.forEach(id => {
        const tabEl = document.getElementById(id);
        if (tabEl) tabEl.style.display = id.toLowerCase().includes(tabName) ? 'block' : 'none';
    });
};

window.setMute = function(el) {
    document.querySelectorAll('.mute-opt').forEach(o => o.classList.remove('on'));
    el.classList.add('on');
};

function getTabElementByName(tabName) {
    return Array.from(document.querySelectorAll('.qp-tab'))
        .find(tab => tab.textContent.toLowerCase().includes(tabName.toLowerCase()));
}

// ==========================================
// 4. MODERATION WORKFLOW
// ==========================================

const ACTION_FEEDBACK = {
    warn:     { icon:'⚠️', msg:'Warning issued', badge:'review' },
    mute:     { icon:'🔇', msg:'User muted successfully', badge:'review' },
    ban7:     { icon:'🚫', msg:'7-day ban applied', badge:'escalated' },
    banperm:  { icon:'⛔', msg:'Permanent ban applied', badge:'escalated' },
    dismiss:  { icon:'✅', msg:'Report dismissed — no action', badge:'resolved' },
    escalate: { icon:'🔺', msg:'Report escalated to Admin', badge:'escalated' },
};

window.updateActionStatus = function(type) {
    const feedback = ACTION_FEEDBACK[type];
    const statusEl = document.getElementById('actionStatus');
    if (statusEl) {
        statusEl.textContent = `${feedback.icon} ${feedback.msg}`;
        statusEl.classList.add('action-status-active');
        setTimeout(() => statusEl.classList.remove('action-status-active'), 2000);
    }
};

function updateStoredReport(report) {
    const stored = JSON.parse(localStorage.getItem('modPanelNewReports') || '[]');
    const idx = stored.findIndex(r => r.id === report.id);
    if (idx !== -1) {
        stored[idx] = { ...stored[idx], badge: report.badge, action: report.action || stored[idx].action || 'None' };
        localStorage.setItem('modPanelNewReports', JSON.stringify(stored));
    }
}


window.takeAction = async function(type) {
    const feedback = ACTION_FEEDBACK[type];
    const report = REPORTS_DATA[currentReportIdx];
    const user = report.user;
    
    window.showToast(feedback.icon, `${feedback.msg} — ${user}`);
    window.updateActionStatus(type);

    // Update backend
    if (feedback.badge) {
        try {
            await api.patch(`/reports/${report.backendId}/status`, { status: feedback.badge === 'resolved' ? 'resolved' : 'reviewed' });
            
            report.badge = feedback.badge === 'resolved' ? 'resolved' : 'review';
            report.unread = false;
            report.action = feedback.msg;

            window.renderQueue();

            if (report.badge === 'resolved') {
                const nextIdx = REPORTS_DATA.findIndex((r, i) =>
                    i !== currentReportIdx &&
                    ['pending', 'reviewed'].includes(r.badge)
                );

                if (nextIdx !== -1) {
                    window.selectReport(null, nextIdx);
                } else {
                    currentReportIdx = -1;
                }
            }
        } catch (err) {
            console.error("Action failed:", err);
        }
    }
};

window.resolveReport = function() {
    const resolvedReport = REPORTS_DATA[currentReportIdx];
    if (!resolvedReport) {
        window.showToast('⚠️', 'No report selected to resolve.');
        return;
    }

    resolvedReport.badge = 'resolved';
    resolvedReport.unread = false;
    resolvedReport.action = 'Resolved by Moderator';
    updateStoredReport(resolvedReport);

    const actionEl = document.getElementById('dpAction');
    if (actionEl) {
        actionEl.textContent = `Last action: ${resolvedReport.action}`;
        actionEl.classList.add('updated');
    }

    window.showToast('✅', `Report ${resolvedReport.id} resolved. Loading next report...`);
    window.renderQueue();

    const nextIdx = REPORTS_DATA.findIndex((report, i) =>
        i !== currentReportIdx &&
        ['pending', 'escalated', 'review'].includes(report.badge)
    );

    if (nextIdx !== -1) {
        window.selectReport(null, nextIdx);
        return;
    }

    currentReportIdx = -1;
    const resolvedTab = getTabElementByName('resolved');
    if (resolvedTab) {
        window.setQTab(resolvedTab, 'resolved');
    }
};

window.switchCommunity = function(el, name, icon) {
    document.querySelectorAll('.comm-item').forEach(c => c.classList.remove('active'));
    el.classList.add('active');

    const nameEl = document.getElementById('activeCommName');
    const iconEl = document.getElementById('activeCommIcon');

    if (nameEl) nameEl.textContent = name;
    if (iconEl) iconEl.textContent = icon;

    window.showToast('🏘️', `Switched mod context to ${name}`);
    // In a real app, this would trigger a fetch for that community's reports
    window.renderQueue();
};

window.filterQueue = function(val) {
    window.renderQueue(val);
};

// ==========================================
// 5. UTILITIES & INIT
// ==========================================

window.showToast = function(icon, msg) {
    const t = document.getElementById('toast');
    const tIcon = document.getElementById('toastIcon');
    const tMsg = document.getElementById('toastMsg');

    if (!t || !tIcon || !tMsg) return;

    tIcon.textContent = icon;
    tMsg.textContent = msg;
    t.classList.add('show');

    clearTimeout(toastDebounce);
    toastDebounce = setTimeout(() => t.classList.remove('show'), 2800);
};

function capitalize(s) {
    if (s === 'review') return 'In Review';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    const keyMap = {
        w: 'warn', m: 'mute', b: 'ban7',
        p: 'banperm', d: 'dismiss', e: 'escalate'
    };

    const action = keyMap[e.key.toLowerCase()];
    if (action) {
        e.preventDefault();
        window.takeAction(action);
    }
});

// ==========================================
// SIDEBAR TOGGLE
// ==========================================

window.toggleSidebar = function() {
    const sidebar = document.getElementById('modSidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('modSidebarCollapsed', isCollapsed);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.renderQueue();
    
    // Restore sidebar state
    const isCollapsed = localStorage.getItem('modSidebarCollapsed') === 'true';
    if (isCollapsed) {
        const sidebar = document.getElementById('modSidebar');
        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
    }
    
    console.log("Moderator Review Panel v3.0 initialized.");
});
