/**
 * Gameunity — Home Dashboard Logic
 * Handles dynamic data rendering for joined communities, notifications, and events.
 */

// --- 1. DYNAMIC RENDERING ---
function renderDashboard() {
    renderGreeting();
    renderJoinedCommunities();
    renderUpcomingEvents();
    updateStatsBanner();
}

function renderGreeting() {
    const user = JSON.parse(localStorage.getItem('nexus_user'));
    const greetingNameEl = document.querySelector('.greeting-name');
    if (greetingNameEl && user) {
        const hour = new Date().getHours();
        let prefix = "Good morning";
        if (hour >= 12) prefix = "Good afternoon";
        if (hour >= 18) prefix = "Good evening";
        
        greetingNameEl.textContent = `${prefix}, ${user.firstName || user.username} 👋`;
    }
}

function renderJoinedCommunities() {
    const container = document.querySelector('.communities-scroll');
    if (!container) return;

    const communities = window.NexusCRUD.getAll('communities');
    const joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');

    const joinedCommunities = communities.filter(c => joinedList.includes(c.slug));

    if (joinedCommunities.length === 0) {
        container.innerHTML = `
            <div class="community-card-link" onclick="window.location.href='discovery.html'">
                <div class="comm-card" style="border: 2px dashed var(--bg-card); background: transparent; justify-content: center; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">🔍</span>
                    <span style="font-size: 13px; color: var(--text-3);">Explore Communities</span>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = joinedCommunities.map((comm, index) => {
        const bannerClass = comm.grad ? comm.grad.replace('grad-', 'banner-') : 'banner-purple';
        return `
            <div class="community-card-link" onclick="window.location.href='community-page.html?name=${comm.slug}'">
              <div class="comm-card">
                <div class="comm-card-banner ${bannerClass}"></div>
                <div class="comm-card-icon ${comm.grad}">${comm.icon}</div>
                <div class="comm-card-name">${comm.name}</div>
                <div class="comm-card-meta">
                    <span>${comm.members.toLocaleString()} members</span>
                </div>
              </div>
            </div>
        `;
    }).join('');
}

function renderUpcomingEvents() {
    const container = document.querySelector('.event-list');
    if (!container) return;

    const events = window.NexusCRUD.getWhere('events', e => e.status === 'upcoming').slice(0, 3);

    if (events.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:var(--text-3);">No upcoming events.</div>';
        return;
    }

    container.innerHTML = events.map(ev => {
        const date = new Date(ev.date);
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });

        return `
            <div class="event-card" onclick="window.location.href='events.html?id=${ev.id}'">
                <div class="ev-date">
                    <div class="ev-mon">${month}</div>
                    <div class="ev-day">${day}</div>
                </div>
                <div class="ev-info">
                    <div class="ev-name">${ev.title}</div>
                    <div class="ev-meta">${ev.time} · ${ev.attendees} attending</div>
                </div>
                <div class="ev-arrow">→</div>
            </div>
        `;
    }).join('');
}

function updateStatsBanner() {
    const communities = window.NexusCRUD.getAll('communities');
    const joinedCount = JSON.parse(localStorage.getItem('nexus_joined_communities') || '["pro-gamers"]').length;
    
    // Update "Joined" stat in greeting
    const stats = document.querySelectorAll('.g-stat');
    stats.forEach(stat => {
        const label = stat.querySelector('.g-stat-label')?.textContent.toLowerCase();
        const valEl = stat.querySelector('.g-stat-val');
        if (label?.includes('communities') && valEl) {
            valEl.textContent = joinedCount;
        }
    });
}

// --- 2. NOTIFICATION MANAGEMENT ---
window.markAllRead = function () {
    const unreadItems = document.querySelectorAll(".notif-item.unread");
    unreadItems.forEach((item) => {
        item.classList.remove("unread");
        item.classList.add("read");
    });

    const headerBadge = document.querySelector(".header-actions .notif-dot");
    if (headerBadge) headerBadge.style.background = "var(--success)";
    if (window.toast) window.toast("Notifications marked as read");
};

// --- 3. UTILITIES ---
function initHorizontalScroll() {
    const scrollContainer = document.querySelector(".communities-scroll");
    if (!scrollContainer) return;

    scrollContainer.addEventListener("wheel", (evt) => {
        evt.preventDefault();
        scrollContainer.scrollLeft += evt.deltaY;
    });
}

// --- 4. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure store is ready before rendering
    if (window.NexusData) window.NexusData.getStore();
    
    renderDashboard();
    initHorizontalScroll();
    
    console.log("%c[Dashboard] %cReady.", "color: #5B6EF5; font-weight: bold;", "color: #10B981;");
});
