/**
 * Se7enSquare — Events Page
 * Fully backend-driven: all CRUD goes to /api/events & /api/communities
 */

let currentActiveTab = 'upcoming';
let activeFilter     = 'all events';
let selectedEventType = 'Online';

let _events      = [];
let _communities = [];

const EVENTS_STORAGE_KEY = 'events';

function readStoredEvents() {
    try {
        const events = JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY)) || [];
        return Array.isArray(events) ? events : [];
    } catch (e) {}

    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify([]));
    return [];
}

function writeStoredEvents(events) {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function createEvent(data) {
    const events = readStoredEvents();
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const event = {
        ...data,
        id: Date.now(),
        createdBy: currentUser?.username || currentUser?.name || data.createdBy || 'user1',
        attendees: 0,
        status: 'pending'
    };

    events.push(event);
    writeStoredEvents(events);
    alert('Event request sent for approval');
    return event;
}

function isApprovedEvent(event) {
    return event.status === 'approved';
}

function canApproveEvents() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const role = typeof normalizeRole === 'function' ? normalizeRole(user?.role) : user?.role;
    return role === 'community_manager' || role === 'manager' || role === 'admin';
}

function isSystemAdmin() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    return user?.role === 'admin';
}

// ── Load ─────────────────────────────────────────────────────────────────────
async function loadData() {
    try {
        _events = readStoredEvents();
        _communities = await window.API.communities.getAll();
    } catch (err) {
        console.error('[Events] Backend error:', err);
        _events = readStoredEvents();
        _communities = [];
    }

    if (!_communities.length) {
        _communities = [
            { id: 'pro-gamers', slug: 'pro-gamers', name: 'Pro Gamers', icon: '⚡' },
            { id: 'gameunity', slug: 'gameunity', name: 'Gameunity', icon: '◇' }
        ];
    }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderAll() {
    const userRegistrations = JSON.parse(localStorage.getItem('nexus_registered_events') || '[]');
    updateTabCounts(userRegistrations);
    renderRoleControls();

    if (currentActiveTab === 'upcoming') {
        renderUpcomingGrid(userRegistrations);
        renderFeaturedEvent(userRegistrations);
    } else if (currentActiveTab === 'registered') {
        renderRegisteredGrid(userRegistrations);
    }
}

function updateTabCounts(registrations) {
    const upcomingCount = _events.filter(isApprovedEvent).length;
    const tabUpcoming   = document.querySelector('.tab-btn[onclick*="upcoming"] .tab-count');
    const tabReg        = document.querySelector('.tab-btn[onclick*="registered"] .tab-count');
    if (tabUpcoming) tabUpcoming.textContent = upcomingCount;
    if (tabReg)      tabReg.textContent      = registrations.length;
}

function renderUpcomingGrid(registrations) {
    const grid = document.getElementById('upcomingGrid');
    if (!grid) return;

    const filtered = _events.filter(e => {
        if (!isApprovedEvent(e)) return false;
        if (activeFilter === 'all events') return true;
        return (e.type || '').toLowerCase().includes(activeFilter.toLowerCase());
    });

    const subHeader = document.querySelector('#tab-upcoming .section-sub');
    if (subHeader) subHeader.textContent = `${filtered.length} events across your communities`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state">No events found matching "${activeFilter}".</div>`;
        return;
    }

    grid.innerHTML = filtered.map((ev, i) => generateEventCard(ev, registrations, i)).join('');
}

function renderRegisteredGrid(registrations) {
    const grid = document.getElementById('regGrid');
    if (!grid) return;

    const filtered = _events.filter(e => registrations.includes(String(e.id)));

    const subHeader = document.getElementById('reg-sub-header');
    if (subHeader) subHeader.textContent = `${filtered.length} upcoming events you're registered for`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:60px 20px">
            <div style="font-size:40px;margin-bottom:10px">🎟</div>
            <h3>No registrations yet</h3>
            <p>Explore upcoming events and register to see them here.</p>
            <button class="btn-primary" style="margin-top:15px" onclick="switchTab('upcoming',document.querySelector('.tab-btn'))">Browse Events</button>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map((ev, i) => generateRegCard(ev, i)).join('');
}

function renderFeaturedEvent(registrations) {
    const featured = _events.find(e => e.isFeatured && isApprovedEvent(e)) || _events.find(isApprovedEvent);
    const featuredEl = document.querySelector('.featured-event');
    if (!featured) {
        if (featuredEl) featuredEl.style.display = 'none';
        return;
    }
    if (featuredEl) featuredEl.style.display = '';

    const isRegistered = registrations.includes(String(featured.id));
    const featuredAttendees = featured.attendees || 0;
    const featuredCapacity = featured.maxAttendees || featured.capacity || null;
    const isFull = featuredCapacity && featuredAttendees >= featuredCapacity;

    const featTitle    = document.querySelector('.feat-title');
    const featDesc     = document.querySelector('.feat-desc');
    const seatsLeft    = document.querySelector('.seats-left');
    const featBtn      = document.getElementById('featured-register');
    const attendeeCount = document.querySelector('.attendee-count');

    if (featTitle)     featTitle.textContent     = featured.title;
    if (featDesc)      featDesc.textContent       = featured.description;
    if (seatsLeft) {
        seatsLeft.textContent = featuredCapacity
            ? (isFull ? 'Event Full' : `⚡ ${featuredCapacity - featuredAttendees} seats left`)
            : 'Open registration';
    }
    if (attendeeCount) attendeeCount.textContent  = `${featuredAttendees} people registered`;

    if (featBtn) {
        featBtn.textContent = isRegistered ? '✓ Registered' : (isFull ? 'Event Full' : 'Register Now');
        featBtn.className   = `btn-register ${isRegistered ? 'registered' : ''}`;
        featBtn.disabled    = isFull && !isRegistered;
        featBtn.onclick     = () => handleRegistrationToggle(featured.id);
    }
}

function getComm(communityId) {
    const key = String(communityId || '');
    const found = _communities.find(c =>
        String(c.id) === key || String(c.slug || '') === key || String(c.name || '').toLowerCase() === key.toLowerCase()
    );
    if (found) return found;
    return _communities.find(c => c.id === communityId) || { name: 'Unknown', icon: '🎮' };
}

function generateEventCard(ev, registrations, index) {
    const comm       = getComm(ev.communityId);
    const isRegistered = registrations.includes(String(ev.id));
    const date       = new Date(ev.date);
    const day        = date.getDate().toString().padStart(2, '0');
    const month      = date.toLocaleString('en-US', { month: 'short' });
    const attendees  = ev.attendees || 0;
    const capacity   = ev.maxAttendees || ev.capacity || null;
    const isFull     = capacity && attendees >= capacity;
    const seatsLabel = capacity ? `âš¡ ${capacity - attendees} seats left` : 'Open registration';
    ev.attendees = attendees;
    ev.maxAttendees = capacity || attendees;

    return `
        <div class="ev-card delay-${(index % 10) * 5}">
            <div class="ev-card-banner" style="background:linear-gradient(135deg,var(--accent),var(--bg-surface))">
                <div class="ev-card-banner-inner">${comm.icon}</div>
                <div class="ev-card-badges">
                    <span class="ev-badge badge-online">${ev.type || 'event'}</span>
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
                    <div class="ev-meta-tag">⏰ ${ev.time || '—'}</div>
                    <div class="ev-meta-tag">👤 ${attendees} / ${capacity || '∞'}</div>
                    <div class="ev-meta-tag">${ev.type || 'Event'}</div>
                </div>
                <div class="ev-card-footer">
                    <div class="ev-attendees">${isFull ? '🚫 Event Full' : seatsLabel}</div>
                    <div class="ev-actions">
                        <button class="btn-ev" onclick="viewEvent(${ev.id})">View</button>
                        <button class="btn-register ${isRegistered ? 'registered' : ''}" onclick="handleRegistrationToggle(${ev.id})">
                            ${isRegistered ? 'Registered' : 'Register Now'}
                        </button>
                        ${isSystemAdmin() ? `<button class="btn-delete-event" onclick="deleteEvent(${ev.id})" title="Delete">🗑️</button>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateRegCard(ev, index) {
    const comm = getComm(ev.communityId);
    const date = new Date(ev.date);

    return `
        <div class="reg-card delay-${(index % 10) * 5}">
            <div class="reg-card-banner" style="background:linear-gradient(135deg,var(--bg-card),var(--accent-low))">
                <div class="reg-card-banner-inner">🎟</div>
            </div>
            <div class="reg-card-body">
                <div class="reg-card-top">
                    <div class="reg-date-box">
                        <div class="reg-mon">${date.toLocaleString('en-US', { month: 'short' })}</div>
                        <div class="reg-day">${date.getDate()}</div>
                    </div>
                    <div>
                        <div class="reg-title">${ev.title}</div>
                        <div class="reg-comm">
                            <div class="reg-comm-av">${comm.icon}</div>
                            <div class="reg-comm-name">${comm.name}</div>
                        </div>
                    </div>
                </div>
                <div class="reg-meta">
                    <div class="reg-meta-item">⏰ ${ev.time || '—'}</div>
                    <div class="reg-meta-item">${ev.type || 'Event'}</div>
                </div>
                <div class="reg-status-row">
                    <span class="reg-status status-confirmed">✓ Confirmed</span>
                    <span class="ticket-id">TKT-${String(ev.id).padStart(6, '0')}</span>
                </div>
                <div class="reg-card-footer">
                    <div class="ev-attendees">👥 ${ev.attendees || 0} attending</div>
                    <div class="reg-actions">
                        <button class="btn-cancel" onclick="handleRegistrationToggle(${ev.id})">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ── Actions ───────────────────────────────────────────────────────────────────
window.handleRegistrationToggle = async function (eventId) {
    let registrations = JSON.parse(localStorage.getItem('nexus_registered_events') || '[]');
    const id = String(eventId);
    const isRegistered = registrations.includes(id);
    const event = _events.find(e => String(e.id) === id);
    if (!event) return;

    if (isRegistered) {
        const newAttendees = Math.max(0, (event.attendees || 0) - 1);
        event.attendees = newAttendees;
        registrations = registrations.filter(r => r !== id);
        if (window.toast) window.toast(`Unregistered from ${event.title}`);
    } else {
        if (event.maxAttendees && event.attendees >= event.maxAttendees) {
            if (window.toast) window.toast('Cannot register — Event is full!', 'error');
            return;
        }
        const newAttendees = (event.attendees || 0) + 1;
        event.attendees = newAttendees;
        registrations.push(id);
        if (window.toast) window.toast(`Registered for ${event.title}! 🎟`);
    }

    writeStoredEvents(_events);
    localStorage.setItem('nexus_registered_events', JSON.stringify(registrations));
    renderAll();
};

window.deleteEvent = async function (eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
        _events = _events.filter(e => e.id !== eventId);
        writeStoredEvents(_events);
        if (window.toast) window.toast('Event deleted. 🗑️');
        renderAll();
    } catch (err) {
        if (window.toast) window.toast('Error deleting event: ' + err.message, 'error');
    }
};

// ── Create Event ──────────────────────────────────────────────────────────────
function initForm() {
    const form = document.getElementById('createEventForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleEventSubmit();
    });

    form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', () => {
            field.classList.remove('field-error');
            const errEl = document.getElementById('err-' + field.id.replace('ev', '').toLowerCase());
            if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
        });
    });
}

function validateForm() {
    const titleEl = document.getElementById('evTitle');
    const descEl  = document.getElementById('evDesc');
    const dateEl  = document.getElementById('evDate');
    const timeEl  = document.getElementById('evTime');
    const maxEl   = document.getElementById('evMax');
    const commEl  = document.getElementById('evCommunity');
    const categoryEl = document.getElementById('evCategory');

    const title   = titleEl.value.trim();
    const desc    = descEl.value.trim();
    const date    = dateEl.value;
    const time    = timeEl.value;
    const max     = parseInt(maxEl.value);
    const commId  = commEl.value;
    const category = categoryEl.value;

    let isValid   = true;

    document.querySelectorAll('.error-msg').forEach(e => { e.textContent = ''; e.classList.remove('show'); });
    document.querySelectorAll('.field-error').forEach(e => e.classList.remove('field-error'));

    const showError = (el, msg, errId) => {
        const errEl = document.getElementById(errId);
        if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
        if (el) el.classList.add('field-error');
        isValid = false;
    };

    if (!title) showError(titleEl, 'Title is required', 'err-title');
    if (!desc || desc.length < 10) showError(descEl, 'Minimum 10 characters required', 'err-desc');
    if (!date) showError(dateEl, 'Date required', 'err-date');
    else {
        const sel = new Date(date);
        const today = new Date(); today.setHours(0,0,0,0);
        if (sel < today) showError(dateEl, 'Select a valid future date', 'err-date');
    }
    if (!time) showError(timeEl, 'Time required', 'err-time');
    if (!max || max < 1) showError(maxEl, 'Invalid capacity', 'err-max');
    if (!commId) showError(commEl, 'Community is required', 'err-community');
    if (!category) showError(categoryEl, 'Category is required', 'err-category');

    if (!isValid) {
        if (window.toast) window.toast('Please correct the highlighted fields.', 'error');
        document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    return true;
}

function handleEventSubmit() {
    if (!validateForm()) return;

    const titleEl = document.getElementById('evTitle');
    const descEl  = document.getElementById('evDesc');
    const dateEl  = document.getElementById('evDate');
    const timeEl  = document.getElementById('evTime');
    const maxEl   = document.getElementById('evMax');
    const commEl  = document.getElementById('evCommunity');
    const categoryEl = document.getElementById('evCategory');

    try {
        createEvent({
            title: titleEl.value.trim(),
            description: descEl.value.trim(),
            date: dateEl.value,
            time: timeEl.value,
            communityId: commEl.value,
            capacity: Number(maxEl.value),
            maxAttendees: Number(maxEl.value),
            category: categoryEl.value,
            type: selectedEventType,
            coverImage: window.currentEventCover || ''
        });
        _events = readStoredEvents();
        if (window.toast) {
            window.toast(`"${titleEl.value.trim()}" submitted for manager approval.`);
        }
        else alert('Event sent for approval');
        resetForm();
        const btn = document.querySelector('.tab-btn[onclick*="upcoming"]');
        switchTab('upcoming', btn || document.querySelector('.tab-btn'));
        renderAll();
    } catch (err) {
        if (window.toast) window.toast('Could not create event: ' + err.message, 'error');
    }
}

function resetForm() {
    const form = document.getElementById('createEventForm');
    if (form) form.reset();
    window.currentEventCover = '';
    const uploadPreview = document.getElementById('uploadPreview');
    const uploadDefault = document.getElementById('uploadDefault');
    if (uploadPreview) {
        uploadPreview.style.display = 'none';
        uploadPreview.innerHTML = '';
    }
    if (uploadDefault) uploadDefault.style.display = '';
    updatePreview();
}

window.handleImageUpload = function (input) {
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
        window.currentEventCover = event.target.result;
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadDefault = document.getElementById('uploadDefault');
        if (uploadPreview) {
            uploadPreview.innerHTML = `<img src="${event.target.result}" alt="Event cover preview">`;
            uploadPreview.style.display = 'block';
        }
        if (uploadDefault) uploadDefault.style.display = 'none';
    };
    reader.readAsDataURL(file);
};

window.saveDraft = function () {
    const drafts = JSON.parse(localStorage.getItem('eventDrafts') || '[]');
    drafts.push({
        id: Date.now(),
        title: document.getElementById('evTitle')?.value.trim() || '',
        description: document.getElementById('evDesc')?.value.trim() || '',
        date: document.getElementById('evDate')?.value || '',
        time: document.getElementById('evTime')?.value || '',
        communityId: document.getElementById('evCommunity')?.value || '',
        capacity: Number(document.getElementById('evMax')?.value || 0),
        category: document.getElementById('evCategory')?.value || '',
        type: selectedEventType,
        coverImage: window.currentEventCover || '',
        status: 'draft'
    });
    localStorage.setItem('eventDrafts', JSON.stringify(drafts));
    if (window.toast) window.toast('Draft saved locally.');
};

function renderRoleControls() {
    const publishBtn = document.getElementById('publishEventBtn');
    if (publishBtn) publishBtn.textContent = 'Request Event';
}

function renderLegacyApprovalPanel() {
    const panel = null;
    const list = null;
    if (!panel || !list) return;

    panel.style.display = canApproveEvents() ? 'block' : 'none';
    if (!canApproveEvents()) return;

    const pending = _events.filter(event => event.status === 'pending');
    if (!pending.length) {
        list.innerHTML = `<div class="empty-state">No pending event requests.</div>`;
        return;
    }

    list.innerHTML = pending.map(event => {
        const comm = getComm(event.communityId);
        return `
            <div class="approval-item">
                <div>
                    <div class="approval-title">${event.title}</div>
                    <div class="approval-meta">${comm.name} · ${event.date} ${event.time || ''} · requested by ${event.createdBy || 'User'}</div>
                    <div class="approval-meta">${event.description || ''}</div>
                </div>
                <div class="approval-actions">
                    <button class="btn-approve" onclick="approveEvent(${event.id})">Approve</button>
                    <button class="btn-reject" onclick="rejectEvent(${event.id})">Reject</button>
                </div>
            </div>`;
    }).join('');
}

async function updateEventStatus(eventId, status) {
    if (!canApproveEvents()) {
        if (window.toast) window.toast('Only Community Managers or Admins can approve events.', 'error');
        return;
    }

    const event = _events.find(item => Number(item.id) === Number(eventId));
    if (!event) return;

    event.status = status;
    writeStoredEvents(_events);
    if (window.toast) window.toast(`Event ${status}.`);
    renderAll();
}

async function validateAndSubmit() {
    handleEventSubmit();
}

window.approveEvent = function (eventId) {
    updateEventStatus(eventId, 'approved');
};

window.rejectEvent = function (eventId) {
    updateEventStatus(eventId, 'rejected');
};

function populateCommunityDropdown() {
    const dropdown = document.getElementById('evCommunity');
    if (!dropdown) return;
    if (!_communities.length) {
        _communities = [{ id: 'pro-gamers', name: 'Pro Gamers', icon: '⚡' }];
    }
    dropdown.innerHTML = _communities.map(c =>
        `<option value="${c.id}">${c.icon || '🏘️'} ${c.name}</option>`
    ).join('');
}

// ── UI ────────────────────────────────────────────────────────────────────────
window.switchTab = function (name, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + name)?.classList.add('active');
    currentActiveTab = name;
    renderAll();
};

window.toggleChip = function (el) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('on'));
    el.classList.add('on');
    activeFilter = el.textContent.toLowerCase().replace('✦ ', '');
    renderAll();
};

window.setType = function (el, type) {
    document.querySelectorAll('.type-opt').forEach(opt => opt.classList.remove('on'));
    el.classList.add('on');
    selectedEventType = type;
};

window.updatePreview = function () {
    const title   = document.getElementById('evTitle')?.value   || 'Your event title';
    const date    = document.getElementById('evDate')?.value    || 'Select a date';
    const time    = document.getElementById('evTime')?.value    || 'time';
    const commId  = document.getElementById('evCommunity')?.value;
    const comm    = _communities.find(c => c.id === commId) || { name: 'Community', icon: '🎮' };

    const prevTitle = document.getElementById('prevTitle');
    const prevDate  = document.getElementById('prevDate');
    if (prevTitle) prevTitle.textContent = title;
    if (prevDate)  prevDate.textContent  = `🗓 ${date} at ${time}`;
};

// ── Init ──────────────────────────────────────────────────────────────────────
window.viewEvent = function (id) {
    const events = readStoredEvents();
    const event = events.find(ev => Number(ev.id) === Number(id));
    if (!event) return;

    const comm = getComm(event.communityId);
    const capacity = event.maxAttendees || event.capacity || 'Open';

    document.getElementById('modalStatus').textContent = event.status || 'approved';
    document.getElementById('modalTitle').textContent = event.title || 'Untitled Event';
    document.getElementById('modalDesc').textContent = event.description || 'No description';
    document.getElementById('modalDate').textContent = `Date: ${event.date || 'Not set'} ${event.time || ''}`;
    document.getElementById('modalCommunity').textContent = `Community: ${comm.name}`;
    document.getElementById('modalCapacity').textContent = `Capacity: ${capacity}`;
    document.getElementById('modalCategory').textContent = `Category: ${event.category || event.type || 'Event'}`;
    document.getElementById('eventModal').classList.remove('hidden');
};

window.closeModal = function () {
    document.getElementById('eventModal')?.classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    populateCommunityDropdown();
    initForm();
    renderAll();
    console.log('%c[Events] %cLive backend data loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
