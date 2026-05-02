/**
 * Gameunity — Events Module Logic
 * Fully data-driven registration, cancellation, and event creation system.
 */

// --- 1. STATE & CONSTANTS ---
let currentActiveTab = "upcoming";
let activeFilter = "all events";
let selectedEventType = "Online";

// --- 2. CORE RENDERING ENGINE ---

/**
 * Main render function that handles all tabs and filtering.
 */
function renderAll() {
    const allEvents = window.NexusCRUD.getAll('events');
    const userRegistrations = JSON.parse(localStorage.getItem('nexus_registered_events') || '[]');
    
    updateTabCounts(allEvents, userRegistrations);
    
    if (currentActiveTab === "upcoming") {
        renderUpcomingGrid(allEvents, userRegistrations);
        renderFeaturedEvent(allEvents, userRegistrations);
    } else if (currentActiveTab === "registered") {
        renderRegisteredGrid(allEvents, userRegistrations);
    }
}

/**
 * Updates the badge counts in the tab bar.
 */
function updateTabCounts(events, registrations) {
    const upcomingCount = events.filter(e => e.status === 'upcoming').length;
    const tabUpcoming = document.querySelector('.tab-btn[onclick*="upcoming"] .tab-count');
    const tabReg = document.querySelector('.tab-btn[onclick*="registered"] .tab-count');
    
    if (tabUpcoming) tabUpcoming.textContent = upcomingCount;
    if (tabReg) tabReg.textContent = registrations.length;
}

/**
 * Renders the primary events grid (Upcoming Tab).
 */
function renderUpcomingGrid(events, registrations) {
    const grid = document.getElementById('upcomingGrid');
    if (!grid) return;

    const filtered = events.filter(e => {
        if (e.status !== 'upcoming') return false;
        if (activeFilter === 'all events') return true;
        return e.category.toLowerCase().includes(activeFilter.toLowerCase()) || 
               e.type.toLowerCase().includes(activeFilter.toLowerCase());
    });

    const subHeader = document.querySelector("#tab-upcoming .section-sub");
    if (subHeader) subHeader.textContent = `${filtered.length} events across your communities`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state">No events found matching "${activeFilter}".</div>`;
        return;
    }

    grid.innerHTML = filtered.map((ev, i) => generateEventCard(ev, registrations, i)).join('');
}

/**
 * Deletes an event after user confirmation.
 */
window.deleteEvent = function(eventId) {
    console.log("[Events] Deleting event ID:", eventId); // Debug check as requested
    
    const confirmDelete = confirm("Are you sure you want to delete this event? This action cannot be undone.");
    if (!confirmDelete) {
        console.log("[Events] Delete cancelled by user.");
        return;
    }

    try {
        // Use the correct CRUD method: 'remove'
        const success = window.NexusCRUD.remove('events', eventId);
        
        if (success) {
            console.log("[Events] Successfully removed from store.");
            if (window.toast) window.toast('Event deleted successfully. 🗑️');
            renderAll(); // Re-render everything instantly
        } else {
            console.error("[Events] Could not find event with ID:", eventId);
            if (window.toast) window.toast('Error: Event not found.', 'error');
        }
    } catch (err) {
        console.error('[Events] System error during delete:', err);
        if (window.toast) window.toast('System failure during deletion.', 'error');
    }
};

/**
 * Renders the user's registrations (My Registrations Tab).
 */
function renderRegisteredGrid(events, registrations) {
    const grid = document.getElementById('regGrid');
    if (!grid) return;

    const filtered = events.filter(e => registrations.includes(e.id));
    
    const subHeader = document.getElementById("reg-sub-header");
    if (subHeader) subHeader.textContent = `${filtered.length} upcoming events you're registered for`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; padding: 60px 20px;">
            <div style="font-size: 40px; margin-bottom: 10px;">🎟</div>
            <h3>No registrations yet</h3>
            <p>Explore upcoming events and register to see them here.</p>
            <button class="btn-primary" style="margin-top: 15px;" onclick="switchTab('upcoming', document.querySelector('.tab-btn'))">Browse Events</button>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map((ev, i) => generateRegCard(ev, i)).join('');
}

/**
 * Helper to generate HTML for an event card in the main grid.
 */
function generateEventCard(ev, registrations, index) {
    const communities = window.NexusCRUD.getAll('communities');
    const comm = communities.find(c => c.id === ev.communityId) || { name: 'Unknown', icon: '🎮' };
    const isRegistered = registrations.includes(ev.id);
    const date = new Date(ev.date);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    
    const isFull = ev.maxAttendees && ev.attendees >= ev.maxAttendees;

    return `
        <div class="ev-card delay-${(index % 10) * 5}">
            <div class="ev-card-banner" style="${ev.coverImage ? `background: url(${ev.coverImage}) center/cover;` : `background: linear-gradient(135deg, var(--accent), var(--bg-surface));`}">
                <div class="ev-card-banner-inner">${ev.coverImage ? '' : comm.icon}</div>
                <div class="ev-card-badges">
                    <span class="ev-badge badge-online">${ev.type}</span>
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
                    <div class="ev-meta-tag">👤 ${ev.attendees} / ${ev.maxAttendees || '∞'}</div>
                    <div class="ev-meta-tag">${ev.category}</div>
                </div>
                <div class="ev-card-footer">
                    <div class="ev-attendees">${isFull ? '🚫 Event Full' : `⚡ ${ev.maxAttendees - ev.attendees} seats left`}</div>
                    <div class="ev-actions">
                    <button class="btn-register ${isRegistered ? 'registered' : ''}" 
                            onclick="handleRegistrationToggle('${ev.id}')">
                        ${isRegistered ? 'Registered' : 'Register Now'}
                    </button>
                    <button class="btn-delete-event" onclick="deleteEvent('${ev.id}')" title="Delete this event">
                        🗑️
                    </button>
                </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Helper to generate HTML for a registration card.
 */
function generateRegCard(ev, index) {
    const communities = window.NexusCRUD.getAll('communities');
    const comm = communities.find(c => c.id === ev.communityId) || { name: 'Unknown', icon: '🎮' };
    const date = new Date(ev.date);
    
    return `
        <div class="reg-card delay-${(index % 10) * 5}">
            <div class="reg-card-banner" style="background: linear-gradient(135deg, var(--bg-card), var(--accent-low));">
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
                    <div class="reg-meta-item">⏰ ${ev.time}</div>
                    <div class="reg-meta-item">${ev.type || 'Event'}</div>
                    <div class="reg-meta-item">${ev.category || ''}</div>
                </div>
                <div class="reg-status-row">
                    <span class="reg-status status-confirmed">✓ Confirmed</span>
                    <span class="ticket-id">TKT-${ev.id.substring(0,6).toUpperCase()}</span>
                </div>
                <div class="reg-card-footer">
                    <div class="ev-attendees">👥 ${ev.attendees} attending</div>
                    <div class="reg-actions">
                        <button class="btn-add-cal" onclick="window.toast ? window.toast('Adding to calendar...') : alert('Adding to calendar...')">📅 Calendar</button>
                        <button class="btn-cancel" onclick="handleRegistrationToggle('${ev.id}')">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders the "Featured Event" (top of Upcoming tab).
 */
function renderFeaturedEvent(events, registrations) {
    const featured = events.find(e => e.isFeatured) || events[0];
    if (!featured) return;

    const isRegistered = registrations.includes(featured.id);
    const isFull = featured.maxAttendees && featured.attendees >= featured.maxAttendees;
    
    // Update labels
    const featTitle = document.querySelector('.feat-title');
    const featDesc = document.querySelector('.feat-desc');
    const seatsLeft = document.querySelector('.seats-left');
    const featBtn = document.getElementById('featured-register');
    const attendeeCount = document.querySelector('.attendee-count');

    if (featTitle) featTitle.textContent = featured.title;
    if (featDesc) featDesc.textContent = featured.description;
    if (seatsLeft) seatsLeft.textContent = isFull ? 'Event Full' : `⚡ ${featured.maxAttendees - featured.attendees} seats left`;
    if (attendeeCount) attendeeCount.textContent = `${featured.attendees} people registered`;
    
    if (featBtn) {
        featBtn.textContent = isRegistered ? '✓ Registered' : (isFull ? 'Event Full' : 'Register Now');
        featBtn.className = `btn-register ${isRegistered ? 'registered' : ''}`;
        featBtn.disabled = isFull && !isRegistered;
        featBtn.onclick = () => handleRegistrationToggle(featured.id);
    }
}

// --- 3. EVENT ACTIONS (REGISTRATION) ---

/**
 * Unified handler for both Register and Cancel actions.
 */
window.handleRegistrationToggle = function(eventId) {
    let registrations = JSON.parse(localStorage.getItem('nexus_registered_events') || '[]');
    const isRegistered = registrations.includes(eventId);
    const event = window.NexusCRUD.getById('events', eventId);
    
    if (!event) return;

    if (isRegistered) {
        // Cancel
        registrations = registrations.filter(id => id !== eventId);
        event.attendees = Math.max(0, event.attendees - 1);
        if (window.toast) window.toast(`Unregistered from ${event.title}`);
    } else {
        // Register
        if (event.maxAttendees && event.attendees >= event.maxAttendees) {
            if (window.toast) window.toast('Cannot register — Event is full!', 'error');
            return;
        }
        registrations.push(eventId);
        event.attendees++;
        if (window.toast) window.toast(`Successfully registered for ${event.title}! 🎟`);
    }

    // Save changes
    window.NexusCRUD.update('events', eventId, { attendees: event.attendees });
    localStorage.setItem('nexus_registered_events', JSON.stringify(registrations));
    
    renderAll();
};

// --- 4. EVENT CREATION & VALIDATION ---

let uploadedImageBase64 = null;

/**
 * Handles the image upload and preview.
 */
window.handleImageUpload = function(input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast('Please upload an image file.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImageBase64 = e.target.result;
        
        // Show in form upload area
        const previewArea = document.getElementById('uploadPreview');
        const defaultArea = document.getElementById('uploadDefault');
        if (previewArea && defaultArea) {
            previewArea.innerHTML = `<img src="${uploadedImageBase64}" style="max-height: 100px; border-radius: 8px;">`;
            previewArea.style.display = 'block';
            defaultArea.style.display = 'none';
        }

        // Show in Live Preview card
        const liveBanner = document.querySelector('.preview-banner');
        if (liveBanner) {
            liveBanner.innerHTML = `<img src="${uploadedImageBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
    };
    reader.readAsDataURL(file);
};

// --- 4. CREATE EVENT & VALIDATION ---

/**
 * Initializes form listeners for production behavior.
 */
function initForm() {
    const form = document.getElementById('createEventForm');
    if (!form) return;

    // 1. Intercept Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        validateAndSubmit();
    });

    // 2. Clear errors on input
    form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', () => {
            field.classList.remove('field-error');
            const errId = 'err-' + field.id.replace('ev', '').toLowerCase();
            const errEl = document.getElementById(errId);
            if (errEl) {
                errEl.classList.remove('show');
                errEl.textContent = '';
            }
        });
    });

    // 3. Load Draft if exists
    restoreDraft();
}

/**
 * Validates all fields and submits to Nexus Store.
 */
function validateAndSubmit() {
    const titleEl = document.getElementById('evTitle');
    const descEl = document.getElementById('evDesc');
    const dateEl = document.getElementById('evDate');
    const timeEl = document.getElementById('evTime');
    const maxEl = document.getElementById('evMax');
    const commEl = document.getElementById('evCommunity');

    const title = titleEl.value.trim();
    const desc = descEl.value.trim();
    const dateInput = dateEl.value;
    const timeInput = timeEl.value;
    const max = parseInt(maxEl.value);
    const commId = commEl.value;

    let isValid = true;

    const showError = (el, msg, errId) => {
        const errEl = document.getElementById(errId);
        if (errEl) {
            errEl.textContent = msg;
            errEl.classList.add('show');
        }
        if (el) el.classList.add('field-error');
        isValid = false;
    };

    // Reset UI
    document.querySelectorAll('.error-msg').forEach(e => {
        e.textContent = '';
        e.classList.remove('show');
    });
    document.querySelectorAll('.field-error').forEach(e => e.classList.remove('field-error'));

    // Validation Rules
    if (title.length < 3) showError(titleEl, "Title must be at least 3 characters", "err-title");
    if (desc.length < 10) showError(descEl, "Description must be at least 10 characters", "err-desc");
    
    if (!dateInput) {
        showError(dateEl, "Date is required", "err-date");
    } else {
        const selectedDate = new Date(dateInput);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (selectedDate < today) showError(dateEl, "Select a valid future date", "err-date");
    }

    if (!timeInput) showError(timeEl, "Time is required", "err-time");
    if (!max || max <= 0) showError(maxEl, "Capacity must be greater than 0", "err-max");
    
    if (!commId) {
        if (window.toast) window.toast('Community is required', 'error');
        isValid = false;
    }

    if (!isValid) {
        if (window.toast) window.toast('Please correct the highlighted fields.', 'error');
        // Scroll to first error
        const firstErr = document.querySelector('.field-error');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Success: Create Event
    saveEvent({ title, desc, dateInput, timeInput, max, commId });
}

/**
 * Stores the validated event in the Nexus Store.
 */
function saveEvent(data) {
    try {
        const newEvent = {
            id: 'ev_' + Date.now(),
            title: data.title,
            description: data.desc,
            date: data.dateInput,
            time: data.timeInput,
            type: selectedEventType,
            category: document.getElementById('evCategory').value,
            communityId: data.commId,
            attendees: 0,
            maxAttendees: data.max,
            status: 'upcoming',
            isFeatured: false,
            coverImage: uploadedImageBase64,
            createdAt: new Date().toISOString()
        };

        // Save
        window.NexusCRUD.create('events', newEvent);
        if (window.toast) window.toast(`"${data.title}" created successfully! 🚀`);

        // Clear Draft
        localStorage.removeItem('nexus_event_draft');
        
        // Reset and Redirect
        resetForm();
        const upcomingTabBtn = document.querySelector('.tab-btn[onclick*="upcoming"]');
        switchTab('upcoming', upcomingTabBtn || document.querySelector('.tab-btn'));
        renderAll();

    } catch (err) {
        console.error('[Events] Submission failed:', err);
        if (window.toast) window.toast('Could not create event. Storage full?', 'error');
    }
}

/**
 * Saves current form state as a draft.
 */
window.saveDraft = function() {
    const draft = {
        title: document.getElementById('evTitle').value,
        desc: document.getElementById('evDesc').value,
        date: document.getElementById('evDate').value,
        time: document.getElementById('evTime').value,
        max: document.getElementById('evMax').value,
        comm: document.getElementById('evCommunity').value,
        type: selectedEventType,
        category: document.getElementById('evCategory').value
    };
    localStorage.setItem('nexus_event_draft', JSON.stringify(draft));
    if (window.toast) window.toast('Draft saved successfully! 💾');
};

/**
 * Restores form state from draft.
 */
function restoreDraft() {
    const raw = localStorage.getItem('nexus_event_draft');
    if (!raw) return;

    try {
        const draft = JSON.parse(raw);
        document.getElementById('evTitle').value = draft.title || '';
        document.getElementById('evDesc').value = draft.desc || '';
        document.getElementById('evDate').value = draft.date || '';
        document.getElementById('evTime').value = draft.time || '';
        document.getElementById('evMax').value = draft.max || '50';
        document.getElementById('evCommunity').value = draft.comm || '';
        document.getElementById('evCategory').value = draft.category || 'Hackathon';
        
        if (draft.type) {
            selectedEventType = draft.type;
            const opts = document.querySelectorAll('.type-opt');
            opts.forEach(o => {
                o.classList.toggle('on', o.textContent.includes(draft.type));
            });
        }

        updatePreview();
        console.log('[Events] Draft restored.');
    } catch (e) {
        console.warn('[Events] Failed to restore draft.');
    }
}

function resetForm() {
    const form = document.getElementById('createEventForm');
    if (form) form.reset();
    
    uploadedImageBase64 = null;
    const previewArea = document.getElementById('uploadPreview');
    const defaultArea = document.getElementById('uploadDefault');
    if (previewArea && defaultArea) {
        previewArea.style.display = 'none';
        defaultArea.style.display = 'block';
    }
    
    updatePreview();
}

// --- 5. UI UTILITIES ---

window.switchTab = function (name, btn) {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".content").forEach((c) => c.classList.remove("active"));
    
    const targetContent = document.getElementById("tab-" + name);
    if (targetContent) targetContent.classList.add("active");

    currentActiveTab = name;
    renderAll();
};

window.toggleChip = function (el) {
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("on"));
    el.classList.add("on");
    activeFilter = el.textContent.toLowerCase().replace("✦ ", "");
    renderAll();
};

window.setType = function(el, type) {
    document.querySelectorAll('.type-opt').forEach(opt => opt.classList.remove('on'));
    el.classList.add('on');
    selectedEventType = type;
    updatePreview();
};

window.updatePreview = function() {
    const title = document.getElementById('evTitle').value || 'Your event title';
    const date = document.getElementById('evDate').value || 'Select a date';
    const time = document.getElementById('evTime').value || 'time';
    const category = document.getElementById('evCategory').value;
    const commId = document.getElementById('evCommunity').value;
    
    const communities = window.NexusCRUD.getAll('communities');
    const comm = communities.find(c => c.id === commId) || { name: 'Pro Gamers', icon: '⚡' };
    
    const prevTitle = document.getElementById('prevTitle');
    const prevDate = document.getElementById('prevDate');
    const prevMeta = document.querySelectorAll('.preview-meta-row');
    
    if (prevTitle) prevTitle.textContent = title;
    if (prevDate) prevDate.textContent = `🗓 ${date} at ${time}`;
    
    if (prevMeta.length >= 2) {
        prevMeta[1].textContent = `${selectedEventType} · ${comm.icon} ${comm.name}`;
        prevMeta[2].textContent = `${category} · 🆓 Free`;
    }

    // Banner logic if no image uploaded
    if (!uploadedImageBase64) {
        const liveBanner = document.querySelector('.preview-banner');
        if (liveBanner) liveBanner.innerHTML = '📅';
    }
};

/**
 * Populates the community dropdown in the creation form.
 */
function populateCommunityDropdown() {
    const communities = window.NexusCRUD.getAll('communities');
    const dropdown = document.getElementById('evCommunity');
    if (!dropdown) return;
    
    dropdown.innerHTML = communities.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
}

// --- 6. INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    populateCommunityDropdown();
    initForm(); // Initialize production form behavior
    renderAll();
    
    console.log("%c[Events] %cEvent System Ready.", "color: #5B6EF5; font-weight: bold;", "color: #10B981;");
});
