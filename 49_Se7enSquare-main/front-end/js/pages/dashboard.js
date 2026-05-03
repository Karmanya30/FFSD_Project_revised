/**
 * Se7enSquare — Dashboard Page
 * Fetches communities and events from the live NestJS backend.
 */

let _communities = [];
let _events      = [];

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadDashboardData() {
    try {
        [_communities, _events] = await Promise.all([
            window.API.communities.getAll(),
            window.API.events.getAll(),
        ]);
    } catch (err) {
        console.warn('[Dashboard] Backend unreachable, running in offline mode:', err.message);
        _communities = [];
        _events = [];
    }
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    renderGreeting();
    renderJoinedCommunities();
    renderUpcomingEvents();
    updateStatsBanner();
}

function renderGreeting() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('currentUser') || '{}');
    const greetingNameEl = document.querySelector('.greeting-name');

    if (user && greetingNameEl) {
        const hour = new Date().getHours();
        let prefix = 'Good morning';
        if (hour >= 12) prefix = 'Good afternoon';
        if (hour >= 18) prefix = 'Good evening';
        const name = typeof getUserFullName === 'function' ? getUserFullName(user) : user.username;
        greetingNameEl.innerHTML = `${prefix}, <span class="user-name">${name}</span> ??`;
    }

    if (typeof renderUserUI === 'function') renderUserUI();
}
function renderJoinedCommunities() {
    const container = document.querySelector('.communities-scroll');
    if (!container) return;

    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const joined = joinedIds.length > 0
        ? _communities.filter(c => joinedIds.includes(String(c.id)))
        : _communities.slice(0, 3); // show first 3 if nothing joined yet

    const commCards = joined.map(c => {
        const grad = c.grad || 'grad-purple';
        const bannerClass = grad.replace('grad-', 'banner-');
        return `
            <div class="community-card-link" onclick="window.location.href='community-page.html?id=${c.id}'">
              <div class="comm-card">
                <div class="comm-card-banner ${bannerClass}"></div>
                <div class="comm-card-icon ${grad}">${c.icon || '🏘️'}</div>
                <div class="comm-card-name">${c.name}</div>
                <div class="comm-card-meta">
                    <span>${(c.memberCount || 0).toLocaleString()} members</span>
                </div>
              </div>
            </div>
        `;
    });

    commCards.push(`
        <div class="community-card-link" onclick="window.location.href='create-community.html'">
          <div class="comm-card create-card">
            <div class="plus">+</div>
            <div class="comm-card-name" style="margin-top: 0;">Create Community</div>
            <div class="comm-card-meta">Start your journey</div>
          </div>
        </div>
    `);

    container.innerHTML = commCards.join('');
}

function renderUpcomingEvents() {
    const container = document.querySelector('.event-list');
    if (!container) return;

    const upcoming = _events.filter(e => e.status === 'approved').slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:var(--text-3);">No upcoming events.</div>';
        return;
    }

    container.innerHTML = upcoming.map(ev => {
        const date  = new Date(ev.date);
        const day   = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });

        return `
            <div class="event-card" onclick="window.location.href='events.html'">
                <div class="event-date">
                    <div class="ev-mon">${month}</div>
                    <div class="ev-day">${day}</div>
                </div>
                <div class="event-info">
                    <h4>${ev.title}</h4>
                    <p>${ev.time || '—'} • ${ev.attendees || 0} attending</p>
                </div>
                <div class="event-action">→</div>
            </div>
        `;
    }).join('');
}

function updateStatsBanner() {
    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const stats = document.querySelectorAll('.g-stat');
    stats.forEach(stat => {
        const label = stat.querySelector('.g-stat-label')?.textContent.toLowerCase();
        const valEl = stat.querySelector('.g-stat-val');
        if (label?.includes('communities') && valEl) {
            valEl.textContent = joinedIds.length;
        }
    });
}

// ── Header nav ────────────────────────────────────────────────────────────────
function initHeaderNavigation() {
    document.getElementById('headerProfile')?.addEventListener('click', () => {
        window.location.href = 'profile-settings.html';
    });
}

function initHorizontalScroll() {
    const sc = document.querySelector('.communities-scroll');
    if (!sc) return;
    sc.addEventListener('wheel', evt => { evt.preventDefault(); sc.scrollLeft += evt.deltaY; });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    renderDashboard();
    initHorizontalScroll();
    initHeaderNavigation();
    console.log('%c[Dashboard] %cLive backend data loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
