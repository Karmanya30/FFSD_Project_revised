// js/pages/admin.js

// ==========================================
// 1. IMPORTS & MOCKS
// ==========================================
// Assuming these are your core modules. If they aren't built yet, 
// you can comment them out to test the UI locally.
// import { fetchData } from '../core/api.js';
// import { requireRole } from '../core/auth.js';

// C1 FIX: requireRole() is provided by auth.js loaded before this script.
// The previous mock (always returned true) has been replaced with a proper delegation.
const requireRole = window.requireRole || function (roles) {
    console.error('[admin.js] auth.js not loaded. Required roles:', roles);
    document.body.innerHTML = '<div style="padding:40px"><h1>403 Forbidden</h1><p>auth.js not loaded.</p></div>';
    return false;
}; 

// ==========================================
// 2. STATE & DATA
// ==========================================
const USERS = [
    { n: 'Alex Morgan', h: 'AM', bg: 'linear-gradient(135deg,#5B6EF5,#8B5CF6)', email: 'alex@email.com', joined: 'Jan 12, 2023', comms: 6, status: 'active' },
    { n: 'Jake Kim', h: 'JK', bg: 'linear-gradient(135deg,#34D399,#059669)', email: 'jake@email.com', joined: 'Feb 3, 2023', comms: 4, status: 'active' },
    { n: 'Sara Lee', h: 'SL', bg: 'linear-gradient(135deg,#F59E0B,#f97316)', email: 'sara@email.com', joined: 'Mar 8, 2023', comms: 8, status: 'active' },
    { n: 'Mia Park', h: 'MP', bg: 'linear-gradient(135deg,#F472B6,#EC4899)', email: 'mia@email.com', joined: 'Apr 1, 2023', comms: 3, status: 'active' },
    { n: 'DarkRaider99', h: 'DR', bg: 'linear-gradient(135deg,#F87171,#dc2626)', email: 'dark@anon.com', joined: 'Aug 14, 2023', comms: 1, status: 'banned' },
    { n: 'FloodBot99', h: 'FB', bg: 'linear-gradient(135deg,#6B7280,#374151)', email: 'bot@spam.io', joined: 'Dec 1, 2023', comms: 12, status: 'banned' },
    { n: 'rustwasm_dev', h: 'RW', bg: 'linear-gradient(135deg,#06B6D4,#0EA5E9)', email: 'rw@dev.io', joined: 'Jan 2, 2024', comms: 2, status: 'new' },
    { n: 'PromoKing', h: 'PK', bg: 'linear-gradient(135deg,#A78BFA,#7C3AED)', email: 'promo@ads.com', joined: 'Jan 9, 2024', comms: 7, status: 'warn' },
    { n: 'EcoUser42', h: 'EU', bg: 'linear-gradient(135deg,#34D399,#059669)', email: 'eco@green.org', joined: 'Jan 10, 2024', comms: 2, status: 'new' },
    { n: 'SoundPromo22', h: 'SP', bg: 'linear-gradient(135deg,#F472B6,#EC4899)', email: 'sp@music.fm', joined: 'Jan 11, 2024', comms: 3, status: 'warn' },
];

const CHART_DATA = {
    '7d': { s: [105, 88, 122, 115, 138, 128, 148], a: [265, 252, 278, 268, 285, 275, 290], ch: [22, 18, 26, 21, 28, 23, 27], m: '7D · +844 signups' },
    '30d': { s: [42, 38, 55, 48, 72, 65, 80, 70, 88, 95, 82, 100, 110, 98, 115, 108, 122, 118, 130, 125, 140, 135, 145, 142, 150, 148, 155, 152, 160, 158], a: [200, 195, 210, 205, 222, 215, 228, 220, 235, 242, 232, 248, 255, 242, 260, 250, 265, 255, 272, 262, 278, 268, 272, 268, 280, 275, 284, 278, 288, 284], ch: [12, 8, 15, 10, 18, 14, 20, 16, 22, 18, 15, 24, 20, 16, 22, 18, 24, 20, 26, 22, 28, 24, 30, 26, 28, 24, 32, 28, 30, 26], m: '30D · +4,821 signups' },
    '90d': { s: Array.from({ length: 90 }, (_, i) => 15 + Math.round(i * 2.2 + Math.sin(i / 5) * 15)), a: Array.from({ length: 90 }, (_, i) => 160 + Math.round(i * 2.5 + Math.sin(i / 7) * 18)), ch: Array.from({ length: 90 }, (_, i) => 8 + Math.round(i * 0.3 + Math.sin(i / 4) * 6)), m: '90D · +14,280 signups' }
};

let curUFilter = 'all';
let curR = '30d';
let curRA = '30d';

// ==========================================
// 3. UTILITIES
// ==========================================
const sanitize = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const p = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - p, 4); // Smooth easing
        obj.innerHTML = Math.floor(easeOutQuart * (end - start) + start).toLocaleString();
        if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Toast Notification
let _tt;
window.toast = function(m) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = m;
    el.classList.add('show');
    clearTimeout(_tt);
    _tt = setTimeout(() => el.classList.remove('show'), 2400);
};

// ==========================================
// 4. NAVIGATION & FILTERS
// ==========================================
window.navTo = function(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    if (el) el.classList.add('active');
    
    const title = el ? (el.childNodes[1]?.textContent?.trim() || el.textContent.replace(/\d+/g, '').trim()) : pageId;
    document.getElementById('page-title').textContent = title;
    
    if (pageId === 'analytics') {
        setTimeout(() => { drawLC2(curRA); drawBars(); }, 80);
    } else if (pageId === 'dashboard') {
        setTimeout(() => drawLC(curR), 80);
    }
};

window.navToByName = function(id) {
    const nav = document.querySelector(`[onclick*="navTo('${id}'"]`);
    window.navTo(id, nav);
};

window.setF = function(el) {
    el.closest('.filter-bar').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    window.toast('Filter: ' + el.textContent.trim());
};

// ==========================================
// 5. USER MANAGEMENT
// ==========================================
function renderUsers(filter, search = '') {
    const tb = document.getElementById('users-tbody');
    if (!tb) return;

    const list = USERS.filter(u => {
        const mF = filter === 'all' || 
                  (filter === 'active' && u.status === 'active') || 
                  (filter === 'banned' && u.status === 'banned') || 
                  (filter === 'new' && u.status === 'new');
        const mS = !search || 
                   u.n.toLowerCase().includes(search.toLowerCase()) || 
                   u.email.toLowerCase().includes(search.toLowerCase());
        return mF && mS;
    });

    tb.innerHTML = list.map(u => {
        // Sanitize inputs to prevent XSS
        const safeName = sanitize(u.n);
        const safeEmail = sanitize(u.email);
        const safeHandle = safeName.toLowerCase().replace(/\s/g, '_');

        const sb = u.status === 'active' ? '<span class="badge badge-active">Active</span>' : 
                   u.status === 'banned' ? '<span class="badge badge-banned">Banned</span>' : 
                   u.status === 'new' ? '<span class="badge badge-pending">New</span>' : 
                   '<span class="badge badge-warn">Warned</span>';
                   
        const ac = u.status === 'banned' ? 
            `<div class="btn-row"><button class="act-btn act-restore" onclick="toast('${safeName} restored')">Restore</button></div>` : 
            `<div class="btn-row">
                <button class="act-btn act-view" onclick="toast('Viewing ${safeName}')">View</button>
                <button class="act-btn act-warn" onclick="toast('Warning sent to ${safeName}')">Warn</button>
                <button class="act-btn act-ban" onclick="toast('${safeName} banned')">Ban</button>
            </div>`;

        return `<tr>
            <td>
                <div class="row-cell">
                    <div class="row-avatar" style="background:${u.bg}">${sanitize(u.h)}</div>
                    <div><div class="row-name">${safeName}</div><div class="row-sub">@${safeHandle}</div></div>
                </div>
            </td>
            <td>${safeEmail}</td>
            <td>${sanitize(u.joined)}</td>
            <td>${u.comms}</td>
            <td>${sb}</td>
            <td>${ac}</td>
        </tr>`;
    }).join('');

    const countEl = document.getElementById('users-count');
    if (countEl) countEl.textContent = `Showing ${list.length} of 148,293 users`;
}

window.filterUsersBy = function(f, el) {
    curUFilter = f;
    el.closest('.filter-bar').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    renderUsers(f);
};

// Expose debounced search to window for the HTML oninput handler
window.filterUsers = debounce((v) => renderUsers(curUFilter, v), 300);

// ==========================================
// 6. CHARTS & VISUALIZATION
// ==========================================
function _drawChart(id, D, metaId) {
    const cv = document.getElementById(id);
    if (!cv) return;
    
    cv.width = cv.parentElement.clientWidth || 480;
    cv.height = cv.parentElement.clientHeight || 170;
    
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, P = 4;
    const MAX = Math.ceil(Math.max(...D.s, ...D.a, ...D.ch) / 50) * 50 + 10;
    
    const yp = v => H - P - (v / MAX) * (H - P * 2);
    const xp = (i, n) => (i / (n - 1)) * W;
    
    function bez(data, fill, stroke, w, dash) {
        if (!data || data.length === 0) return [];
        const pts = data.map((v, i) => ({ x: xp(i, data.length), y: yp(v) }));
        
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const cx = (pts[i - 1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
        }
        
        if (fill) {
            ctx.lineTo(pts[pts.length - 1].x, H);
            ctx.lineTo(pts[0].x, H);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
        }
        
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const cx = (pts[i - 1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
        }
        
        ctx.strokeStyle = stroke;
        ctx.lineWidth = w;
        ctx.setLineDash(dash || []);
        ctx.stroke();
        ctx.setLineDash([]);
        return pts;
    }
    
    const ga = ctx.createLinearGradient(0, 0, 0, H);
    ga.addColorStop(0, 'rgba(6,182,212,0.12)');
    ga.addColorStop(1, 'transparent');
    bez(D.a, ga, 'rgba(6,182,212,0.8)', 1.5);
    
    const gs = ctx.createLinearGradient(0, 0, 0, H);
    gs.addColorStop(0, 'rgba(91,110,245,0.2)');
    gs.addColorStop(1, 'transparent');
    const pS = bez(D.s, gs, '#5B6EF5', 2.5);
    
    bez(D.ch, null, 'rgba(248,113,113,0.7)', 1.5, [5, 4]);
    
    if (pS.length > 0) {
        const lp = pS[pS.length - 1];
        ctx.beginPath(); ctx.arc(lp.x, lp.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#5B6EF5'; ctx.fill();
        ctx.beginPath(); ctx.arc(lp.x, lp.y, 9, 0, Math.PI * 2); ctx.fillStyle = 'rgba(91,110,245,0.2)'; ctx.fill();
    }
    
    const m = document.getElementById(metaId);
    if (m) m.textContent = D.m;
}

function drawLC(r) { _drawChart('lc', CHART_DATA[r], 'lcmeta'); }
function drawLC2(r) { _drawChart('alc', CHART_DATA[r], 'a-lcmeta'); }

window.setR = function(el, r) {
    el.closest('.chart-tabs').querySelectorAll('.chart-tab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    curR = r;
    drawLC(r);
};

window.setRA = function(el, r) {
    el.closest('.chart-tabs').querySelectorAll('.chart-tab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    curRA = r;
    drawLC2(r);
};

function drawBars() {
    const cats = [
        { n: 'Gaming', v: 31400, c: '#5B6EF5' },
        { n: 'Gaming', v: 24800, c: '#F59E0B' },
        { n: 'Design', v: 18200, c: '#06B6D4' },
        { n: 'Education', v: 14600, c: '#F97316' },
        { n: 'Music', v: 9200, c: '#F472B6' },
        { n: 'Other', v: 7400, c: 'rgba(139,92,246,0.5)' }
    ];
    
    const mx = Math.max(...cats.map(c => c.v));
    const fmt = v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v;
    const el = document.getElementById('bar-analytics');
    
    if (!el) return;
    
    el.innerHTML = cats.map(c => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <span style="font-size:12px;color:var(--text-3);width:76px;flex-shrink:0">${c.n}</span>
            <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${(c.v / mx * 100).toFixed(1)}%;background:${c.c};border-radius:4px;transition:width 0.7s ease"></div>
            </div>
            <span style="font-size:12px;color:var(--text-2);width:38px;text-align:right">${fmt(c.v)}</span>
        </div>
    `).join('');
}

// ==========================================
// 7. LIVE FEED SIMULATION
// ==========================================
const liveEvents = [
    { ico: '🏘️', cls: 'lc-green', ev: 'Community created', dt: '"Go Strategy Wizards" queued', tag: 'INFO', tc: 'tag-info' },
    { ico: '👤', cls: 'lc-blue', ev: 'User milestone', dt: 'User #148,300 registered', tag: 'SYS', tc: 'tag-sys' },
    { ico: '⚠️', cls: 'lc-yellow', ev: 'Rate limit hit', dt: 'IP 103.28.x.x throttled', tag: 'WARN', tc: 'tag-warn' },
    { ico: '🔄', cls: 'lc-cyan', ev: 'AutoMod updated', dt: 'Precision → 97.8%', tag: 'SYS', tc: 'tag-sys' },
    { ico: '🚫', cls: 'lc-red', ev: 'Account suspended', dt: '@SpamKing_45 — 12 reports', tag: 'CRITICAL', tc: 'tag-crit' },
];

function initLiveFeed() {
    let li = 0;
    setInterval(() => {
        const feed = document.getElementById('logfeed');
        if (!feed) return;
        
        const e = liveEvents[li++ % liveEvents.length];
        const d = document.createElement('div');
        d.className = 'log-item fresh';
        d.innerHTML = `
            <div class="log-ico ${e.cls}">${e.ico}</div>
            <div class="log-body">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="log-event">${e.ev}</span>
                    <span class="log-tag ${e.tc}">${e.tag}</span>
                </div>
                <div class="log-detail">${e.dt}</div>
            </div>
            <div class="log-time">Now</div>
        `;
        
        feed.insertBefore(d, feed.firstChild);
        while (feed.children.length > 8) {
            feed.removeChild(feed.lastChild);
        }
    }, 9000);
}

// ==========================================
// 8. AUTHENTICATION
// ==========================================

/**
 * Handles user logout functionality
 * Clears session data and redirects to login page
 */
window.logout = function() {
// Clear any stored session data
localStorage.removeItem('nexus_user');
localStorage.removeItem('nexus_owned_communities');
localStorage.removeItem('userToken');
localStorage.removeItem('userData');
sessionStorage.clear();
    
// Show confirmation toast
window.toast("Logging out... ");
    
// Redirect to landing page
setTimeout(() => {
window.location.href = 'landing.html';
}, 1000);
};

// ==========================================
// 9. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // STRICT access control: Only Superusers allowed here
    if (!requireRole(['superuser'])) {
        document.body.innerHTML = '<h1>403 Forbidden</h1><p>Superuser access required.</p>';
        return;
    }

    // Initialize Dashboard UI
    renderUsers('all');
    initLiveFeed();
    
    // Trigger initial stats animations
    setTimeout(() => {
        animateValue('sv1', 0, 148293, 1400);
        animateValue('sv2', 0, 3247, 1400);
        animateValue('sv3', 0, 42819, 1400);
        animateValue('sv4', 0, 12, 1400);
    }, 300);

    // Initial Chart Render
    requestAnimationFrame(() => requestAnimationFrame(() => drawLC('30d')));
});

// Handle window resizing for responsive canvas charts
window.addEventListener('resize', () => {
    drawLC(curR);
    if (document.getElementById('page-analytics')?.classList.contains('active')) {
        drawLC2(curRA);
    }
});
