/**
 * Gameunity — Events Module Logic
 * Handles dynamic data rendering for events, registration, and discovery.
 */

// --- 1. STATE ---
let currentActiveTab = "upcoming";
let activeFilter = "all events";

// --- 2. DYNAMIC RENDERING ---
function renderEvents() {
    const upcomingGrid = document.querySelector('.events-grid');
    if (!upcomingGrid) return;

    const allEvents = window.NexusCRUD.getAll('events');
    const communities = window.NexusCRUD.getAll('communities');
    
    // Filter Pass
    const regList = JSON.parse(localStorage.getItem('nexus_registered_events') || '["e2"]');
    const filtered = allEvents.filter(e => {
        let matchesTab = true;
        if (currentActiveTab === 'upcoming') matchesTab = (e.status === 'upcoming');
        if (currentActiveTab === 'registered') matchesTab = regList.includes(e.id);

        const matchesFilter = activeFilter === 'all events' || 
                             e.type.toLowerCase().includes(activeFilter.toLowerCase()) ||
                             e.title.toLowerCase().includes(activeFilter.toLowerCase());
        return matchesTab && matchesFilter;
    });

    // Update Counts
    const upcomingCount = allEvents.filter(e => e.status === 'upcoming').length;
    
    const tabUpcoming = document.querySelector('.tab-btn .tab-count');
    const tabReg = document.querySelectorAll('.tab-btn .tab-count')[1];
    if (tabUpcoming) tabUpcoming.textContent = upcomingCount;
    if (tabReg) tabReg.textContent = regList.length;

    const subHeader = document.querySelector("#tab-upcoming .section-sub");
    if (subHeader) {
        subHeader.textContent = `${filtered.length} of ${allEvents.length} events across your communities`;
    }

    // Dynamicize Featured Event
    const featEvent = allEvents.find(e => e.status === 'upcoming');
    if (featEvent && currentActiveTab === 'upcoming') {
        const featTitle = document.querySelector('.feat-title');
        const featDesc = document.querySelector('.feat-desc');
        const featMeta = document.querySelector('.feat-bottom');
        const comm = communities.find(c => c.id === featEvent.communityId);
        
        if (featTitle) featTitle.textContent = featEvent.title;
        if (featDesc) featDesc.textContent = featEvent.description;
        if (featMeta && comm) {
            featMeta.innerHTML = `
                <div class="feat-meta-item">🗓 ${new Date(featEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div class="feat-meta-item">⏰ Starts ${featEvent.time}</div>
                <div class="feat-meta-item">👥 ${featEvent.attendees} registered</div>
                <div class="feat-meta-item">🏢 ${comm.name}</div>
            `;
        }
    }

    if (filtered.length === 0) {
        upcomingGrid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-3);">No events found matching your criteria.</div>';
        return;
    }

    upcomingGrid.innerHTML = filtered.map((ev, index) => {
        const comm = communities.find(c => c.id === ev.communityId) || { name: 'Unknown', icon: '⚡' };
        const date = new Date(ev.date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });

        return `
            <div class="ev-card delay-${(index % 10) * 5}" data-event-id="${ev.id}">
                <div class="ev-card-banner" style="background: linear-gradient(135deg, var(--accent), var(--bg-card));">
                    <div class="ev-card-banner-inner">${comm.icon}</div>
                    <div class="ev-card-badges">
                        <span class="ev-badge badge-online">🌐 ${ev.type}</span>
                    </div>
                </div>
                <div class="ev-card-body">
                    <div class="ev-card-top">
                        <div class="ev-date-box">
                            <div class="ev-date-mon">${month}</div>
                            <div class="ev-date-day">${day}</div>
                        </div>
                        <div>
                            <div class="ev-card-title">${ev.title}</div>
                            <div class="ev-card-comm">
                                <div class="ev-comm-av">${comm.icon}</div>
                                <div class="ev-comm-name">${comm.name}</div>
                            </div>
                        </div>
                    </div>
                    <div class="ev-card-meta">
                        <div class="ev-meta-tag">⏰ ${ev.time}</div>
                        <div class="ev-meta-tag">👤 ${ev.attendees} going</div>
                        <div class="ev-meta-tag">📍 Online</div>
                    </div>
                    <div class="ev-card-footer">
                        <div class="ev-attendees">Capacity: ${ev.maxAttendees || 'Unlimited'}</div>
                        <button class="btn-ev ${regList.includes(ev.id) ? 'registered' : ''}" onclick="toggleReg(this, '${ev.id}')">${regList.includes(ev.id) ? '✓ Registered' : 'Register'}</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- 3. EVENT HANDLERS ---
window.switchTab = function (name, btn) {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".content").forEach((c) => c.classList.remove("active"));
    
    const targetContent = document.getElementById("tab-" + name);
    if (targetContent) targetContent.classList.add("active");

    currentActiveTab = name;
    renderEvents();
};

window.toggleChip = function (el) {
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("on"));
    el.classList.add("on");
    activeFilter = el.textContent.toLowerCase().replace("✦ ", "");
    renderEvents();
};

window.toggleReg = function (btn, eventId) {
    let regList = JSON.parse(localStorage.getItem('nexus_registered_events') || '["e2"]');
    const isRegistered = regList.includes(eventId);
    const ev = window.NexusCRUD.getById('events', eventId);
    if (!ev) return;

    if (isRegistered) {
        regList = regList.filter(id => id !== eventId);
        btn.classList.remove("registered");
        btn.textContent = "Register";
        if (window.toast) window.toast(`Unregistered from ${ev.title}`);
    } else {
        regList.push(eventId);
        btn.classList.add("registered");
        btn.textContent = "✓ Registered";
        if (window.toast) window.toast(`Successfully registered for ${ev.title}! 🎟`);
    }
    
    localStorage.setItem('nexus_registered_events', JSON.stringify(regList));
    renderEvents();
};

window.toggleLoadMoreEvents = function() {
    const btn = document.getElementById('load-more-events-btn');
    if (!btn) return;
    btn.textContent = 'Loading...';
    setTimeout(() => {
        btn.textContent = 'No more events to load';
        btn.disabled = true;
    }, 1200);
};

window.registerFeaturedEvent = function(btn) {
    const featEvent = window.NexusCRUD.getAll('events').find(e => e.status === 'upcoming');
    if (featEvent) {
        window.toggleReg(btn, featEvent.id);
    }
};

window.setType = function(el, type) {
    document.querySelectorAll('.type-opt').forEach(opt => opt.classList.remove('on'));
    el.classList.add('on');
    updatePreview();
};

window.updatePreview = function() {
    const title = document.getElementById('evTitle').value || 'Your event title';
    const date = document.getElementById('evDate').value || 'Select a date';
    const time = document.getElementById('evTime').value || 'time';
    
    const prevTitle = document.getElementById('prevTitle');
    const prevDate = document.getElementById('prevDate');
    
    if (prevTitle) prevTitle.textContent = title;
    if (prevDate) prevDate.textContent = `🗓 ${date} at ${time}`;
};

// --- 4. STARTUP ---
document.addEventListener("DOMContentLoaded", () => {
    renderEvents();
    
    // URL Parameter handling for deep linking to a specific event
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("id");
    if (eventId) {
        setTimeout(() => {
            const el = document.querySelector(`[data-event-id="${eventId}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }

    console.log("%c[Events] %cSynchronized with Platform Store.", "color: #5B6EF5; font-weight: bold;", "color: #10B981;");
});
