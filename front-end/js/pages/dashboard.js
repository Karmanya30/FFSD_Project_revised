/**
 * Gameunity — Home Dashboard Logic
 * Handles dynamic data rendering for joined communities, notifications, and events.
 */

// --- 1. DYNAMIC RENDERING ---
function renderDashboard() {
    renderGreeting();
    renderJoinedCommunities();
    renderUpcomingEvents();
    renderRecentNotifications(); // Call the new dynamic renderer
    updateStatsBanner();
}

function renderGreeting() {
    const user = JSON.parse(localStorage.getItem('nexus_user'));
    const greetingNameEl = document.querySelector('.greeting-name');
    const headerAvatarEl = document.getElementById('headerProfile');

    if (user) {
        // Update Greeting Text
        if (greetingNameEl) {
            const hour = new Date().getHours();
            let prefix = "Good morning";
            if (hour >= 12) prefix = "Good afternoon";
            if (hour >= 18) prefix = "Good evening";
            greetingNameEl.textContent = `${prefix}, ${user.firstName || user.username} 👋`;
        }

        // Update Header Avatar Initials
        if (headerAvatarEl) {
            const initials = (user.firstName && user.lastName) 
                ? (user.firstName[0] + user.lastName[0]) 
                : user.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            headerAvatarEl.textContent = initials || "??";
        }
    }
}

function renderJoinedCommunities() {
    const container = document.querySelector('.communities-scroll');
    if (!container) return;

    const communities = window.NexusCRUD.getAll('communities');
    const joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '["pro-gamers"]');

    // Filter joined communities and reverse for "Newest First"
    const joinedCommunities = communities.filter(c => joinedList.includes(c.slug)).reverse();

    const commCards = joinedCommunities.map((comm, index) => {
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
    });

    // Append Primary "Create Community" CTA card
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
                <div class="event-date">
                    <div class="ev-mon">${month}</div>
                    <div class="ev-day">${day}</div>
                </div>
                <div class="event-info">
                    <h4>${ev.title}</h4>
                    <p>${ev.time} • ${ev.attendees} attending</p>
                </div>
                <div class="event-action">→</div>
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

function renderRecentNotifications() {
    const container = document.getElementById('notif-list-container');
    if (!container || !window.NexusCRUD) return;

    const notifications = window.NexusCRUD.getAll('notifications').slice(0, 5);

    if (notifications.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:var(--text-3);">No recent notifications.</div>';
        return;
    }

    container.innerHTML = notifications.map(n => {
        const avatarColor = n.type === 'mention' ? 'grad-purple' : (n.type === 'reaction' ? 'grad-green' : 'grad-orange');
        const initials = n.from ? n.from.split(' ').map(x => x[0]).join('').toUpperCase() : 'SYS';
        
        return `
            <div class="notif-item ${n.unread ? 'unread' : 'read'}" data-id="${n.id}" data-channel="${n.channel || 'general'}">
                <div class="notif-avatar ${avatarColor}">${initials}</div>
                <div class="notif-body">
                    <div class="notif-text"><strong>${n.from || 'System'}</strong> ${n.text}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
                ${n.unread ? '<div class="notif-unread-dot"></div>' : ''}
            </div>
        `;
    }).join('');

    // Re-attach listeners to the new dynamic elements
    initNotificationNavigation();
}

// --- 2. NOTIFICATION MANAGEMENT ---
window.markAllRead = function () {
    if (window.NexusCRUD) {
        const unread = window.NexusCRUD.getWhere('notifications', n => n.unread === true);
        unread.forEach(n => {
            window.NexusCRUD.update('notifications', n.id, { unread: false });
        });
        
        // Update header badge if exists
        const headerBadge = document.querySelector(".header-actions .notif-dot");
        if (headerBadge) headerBadge.style.display = "none";
        
        // Re-render the list
        renderRecentNotifications();
        
        if (window.toast) window.toast("All notifications marked as read");
    }
};

function initNotificationNavigation() {
    const notifItems = document.querySelectorAll('.notif-item');
    notifItems.forEach(item => {
        item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            const channel = item.getAttribute('data-channel') || 'general';

            // Mark as Read in Data Store
            if (window.NexusCRUD && id) {
                window.NexusCRUD.update('notifications', id, { unread: false });
            }

            console.log(`[Dashboard] Marked ${id} as read. Navigating to channel: ${channel}`);
            window.location.href = `chat.html?channel=${channel}`;
        });
    });
}

// --- 3. HEADER NAVIGATION ---
function initHeaderNavigation() {
    // 1. Profile Click
    const profileBtn = document.getElementById('headerProfile');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = 'profile-settings.html';
        });
    }

    // 2. Bell Click (Optional toggle or redirect)
    const bellBtn = document.getElementById('headerNotif');
    if (bellBtn) {
        bellBtn.addEventListener('click', () => {
            // For now, scrolls to notifications section if it exists
            const notifSection = document.querySelector('.section-box');
            if (notifSection) {
                notifSection.scrollIntoView({ behavior: 'smooth' });
                if (window.toast) window.toast("Viewing notifications");
            }
        });
    }
}

// --- 4. UTILITIES ---
function initHorizontalScroll() {
    const scrollContainer = document.querySelector(".communities-scroll");
    if (!scrollContainer) return;

    scrollContainer.addEventListener("wheel", (evt) => {
        evt.preventDefault();
        scrollContainer.scrollLeft += evt.deltaY;
    });
}

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure store is ready before rendering
    if (window.NexusData) window.NexusData.getStore();
    
    renderDashboard();
    initHorizontalScroll();
    initHeaderNavigation();
    initNotificationNavigation();
    
    console.log("%c[Dashboard] %cReady.", "color: #5B6EF5; font-weight: bold;", "color: #10B981;");
});
