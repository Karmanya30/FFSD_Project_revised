/**
 * NexusHub — Moderator Review Panel Logic
 * Handles real-time report triaging, cross-community switching,
 * and automated moderation workflows.
 */

// ==========================================
// 1. DATA & STATE
// ==========================================
let REPORTS_DATA = [
    { id: '#4821', user: 'BadActor_X', av: 'BX', bg: 'linear-gradient(135deg,#EF4444,#DC2626)', channel: '#general', reason: '🚫 Hate Speech / Harassment', badge: 'pending', repeat: '3× offender', time: '2m ago', violations: 3, days: 48, bans: 0, warnings: 2, sub: 'Member since Jan 2026', unread: true },
    { id: '#4820', user: 'SpamBot99', av: 'SP', bg: 'linear-gradient(135deg,#F59E0B,#D97706)', channel: '#frontend', reason: '📢 Spam / Self-promotion', badge: 'pending', repeat: null, time: '14m ago', violations: 1, days: 12, bans: 0, warnings: 0, sub: 'Member since Feb 2026', unread: true },

];

let activeModTab = 'pending';
let currentReportIdx = 0;
let toastDebounce;

function hydrateNewReportsFromStorage() {
    const pending = JSON.parse(localStorage.getItem('modPanelNewReports') || '[]');
    if (Array.isArray(pending) && pending.length) {
        // insert new reports at top
        REPORTS_DATA = [...pending, ...REPORTS_DATA];
    }
}

hydrateNewReportsFromStorage();

// ==========================================
// 2. QUEUE ENGINE
// ==========================================

window.renderQueue = function (searchQuery = '') {
    const listContainer = document.getElementById('queueList');
    if (!listContainer) return;

    const filtered = REPORTS_DATA.filter(report => {
        const matchesTab = activeModTab === 'pending' ? (report.badge === 'pending' || report.badge === 'escalated')
            : activeModTab === 'review' ? report.badge === 'review'
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

window.selectReport = function (el, idx) {
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

window.setQTab = function (el, tab) {
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

window.setDpTab = function (el, tabName) {
    document.querySelectorAll('.dp-tab').forEach(t => t.classList.remove('on'));
    if (el) el.classList.add('on');

    const tabs = ['tabContent', 'tabHistory', 'tabPrevious'];
    tabs.forEach(id => {
        const tabEl = document.getElementById(id);
        if (tabEl) tabEl.style.display = id.toLowerCase().includes(tabName) ? 'block' : 'none';
    });
};

window.setMute = function (el) {
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
    warn: { icon: '⚠️', msg: 'Warning issued', badge: 'review' },
    mute: { icon: '🔇', msg: 'User muted successfully', badge: 'review' },
    ban7: { icon: '🚫', msg: '7-day ban applied', badge: 'escalated' },
    banperm: { icon: '⛔', msg: 'Permanent ban applied', badge: 'escalated' },
    dismiss: { icon: '✅', msg: 'Report dismissed — no action', badge: 'resolved' },
    escalate: { icon: '🔺', msg: 'Report escalated to Admin', badge: 'escalated' },
};

window.updateActionStatus = function (type, customMsg) {
    const feedback = ACTION_FEEDBACK[type];
    const statusEl = document.getElementById('actionStatus');
    if (statusEl) {
        statusEl.textContent = `${feedback.icon} ${customMsg || feedback.msg}`;
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


window.takeAction = function (type) {
    const feedback = ACTION_FEEDBACK[type];
    let msg = feedback.msg;

    if (type === 'mute') {
        const selectedMute = document.querySelector('.mute-opt.on');
        if (selectedMute) {
            msg = `User muted for ${selectedMute.textContent}`;
        }
    }

    const user = REPORTS_DATA[currentReportIdx].user;
    window.showToast(feedback.icon, `${msg} — ${user}`);
    window.updateActionStatus(type, msg);

    // Save action label on report object for detail panel
    REPORTS_DATA[currentReportIdx].action = msg;

    // Only update status for moderation actions; keep in queue unless explicitly resolved
    if (feedback.badge) {
        REPORTS_DATA[currentReportIdx].badge = feedback.badge;
        REPORTS_DATA[currentReportIdx].unread = false;
        updateStoredReport(REPORTS_DATA[currentReportIdx]);

        // --- SYNC WITH NEXUS CRUD FOR ADMIN DASHBOARD ---
        if (window.NexusCRUD) {
            const rData = REPORTS_DATA[currentReportIdx];
            const existing = window.NexusCRUD.getWhere('reports', r => r.reportId === rData.id);
            if (existing && existing.length > 0) {
                window.NexusCRUD.update('reports', existing[0].id, { status: feedback.badge });
            } else if (feedback.badge === 'escalated') {
                window.NexusCRUD.create('reports', {
                    reportId: rData.id,
                    userId: 'u1',
                    reportedBy: 'Moderator',
                    channelId: 'ch1',
                    reason: rData.reason.replace(/[^a-zA-Z\s\/]/g, '').trim(),
                    reasonIcon: '🔺',
                    detail: 'Escalated from Moderator Panel: ' + rData.reason,
                    status: 'escalated',
                    createdAt: new Date().toISOString()
                });
            }
        }
        // ------------------------------------------------

        window.renderQueue();

        if (feedback.badge === 'resolved') {
            const nextIdx = REPORTS_DATA.findIndex((report, i) =>
                i !== currentReportIdx &&
                ['pending', 'escalated', 'review'].includes(report.badge)
            );

            if (nextIdx !== -1) {
                window.selectReport(null, nextIdx);
            } else {
                currentReportIdx = -1;
            }
        }
    }
};

window.resolveReport = function () {
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

window.switchCommunity = function (el, name, icon) {
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

window.filterQueue = function (val) {
    window.renderQueue(val);
};

// ==========================================
// 5. UTILITIES & INIT
// ==========================================

window.showToast = function (icon, msg) {
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

window.toggleModSidebar = function () {

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

        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
    }

    console.log("Moderator Review Panel v3.0 initialized.");
});
