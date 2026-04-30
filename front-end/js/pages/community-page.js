/**
 * Gameunity — Community Page Interactive Logic
 * Handles dynamic data rendering, tab switching, channel selection, and event management.
 */

// --- 1. DATA INITIALIZATION ---
function getActiveCommunity() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('name') || 'pro-gamers';
    
    const communities = window.NexusCRUD.getAll('communities');
    const comm = communities.find(c => c.slug === slug);
    
    if (!comm) {
        console.error(`[CommunityPage] Community not found: ${slug}`);
        // Fallback to first community or pro-gamers
        return communities.find(c => c.slug === 'pro-gamers') || communities[0];
    }
    
    console.log(`[CommunityPage] Loaded: ${comm.name}`, comm);
    return comm;
}

// --- 2. DYNAMIC RENDERING ---
function renderCommunityData() {
    const comm = getActiveCommunity();
    if (!comm) return;

    // Update Banner & Profile Row
    const iconEl = document.getElementById('comm-icon');
    const bigIconEl = document.querySelector('.comm-big-icon');
    const nameTitleEl = document.getElementById('comm-name-title');
    const onlineEl = document.getElementById('comm-online-count');
    const memberEl = document.getElementById('comm-member-count');
    const categoryEl = document.getElementById('comm-category');
    const foundedEl = document.getElementById('comm-founded');

    if (iconEl) iconEl.textContent = comm.icon;
    if (bigIconEl) bigIconEl.textContent = comm.icon;
    if (nameTitleEl) nameTitleEl.textContent = comm.name;
    if (onlineEl) onlineEl.textContent = comm.online.toLocaleString();
    if (memberEl) memberEl.textContent = comm.members.toLocaleString();
    if (categoryEl) categoryEl.textContent = `💻 ${comm.category} · Community`;
    if (foundedEl) foundedEl.textContent = `📅 Founded ${new Date(comm.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

    // Update Tab Counts
    const channelCount = window.NexusCRUD.getWhere('channels', ch => ch.communityId === comm.id).length;
    const tabChannels = document.getElementById('tab-count-channels');
    const tabMembers = document.getElementById('tab-count-members');
    
    if (tabChannels) tabChannels.textContent = channelCount;
    if (tabMembers) tabMembers.textContent = comm.members.toLocaleString();

    // Update About Section
    const descEl = document.getElementById('comm-description');
    const nameTexts = document.querySelectorAll('.comm-name-text');
    
    if (descEl) descEl.textContent = comm.description;
    nameTexts.forEach(el => el.textContent = comm.name);

    // Update Stats Card
    const statTotal = document.getElementById('stat-total-members');
    const statOnline = document.getElementById('stat-online-now');
    if (statTotal) statTotal.textContent = comm.members.toLocaleString();
    if (statOnline) statOnline.textContent = comm.online.toLocaleString();

    // Render Components
    renderChannels(comm.id);
    renderCommunityEvents(comm.id);
    initJoinState(comm.slug);
}

function renderChannels(communityId) {
    const container = document.getElementById('channelsList');
    if (!container) return;

    const channels = window.NexusCRUD.getWhere('channels', ch => ch.communityId === communityId);
    container.innerHTML = '';

    if (channels.length === 0) {
        container.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--text-3);">No channels available.</div>';
        return;
    }

    // Grouping logic (simplified for now as mock data doesn't have groups yet, but we'll add them)
    let lastGroup = null;
    channels.forEach(ch => {
        const groupName = ch.group || (ch.type === 'voice' ? '🔊 Voice Channels' : '💬 Text Channels');
        if (groupName !== lastGroup) {
            const title = document.createElement('div');
            title.className = 'ch-group-title';
            title.textContent = groupName;
            container.appendChild(title);
            lastGroup = groupName;
        }

        const row = document.createElement('div');
        row.className = 'ch-row';
        row.dataset.name = ch.name;
        row.onclick = () => selectChannel(row, ch.name, ch.description);
        
        const icon = ch.type === 'voice' ? '🔊' : (ch.name === 'announcements' ? '📢' : '#');
        row.innerHTML = `
            <span class='ch-icon'>${icon}</span>
            <span class='ch-name'>${ch.name}</span>
            ${ch.unread ? `<span class='ch-unread'>${ch.unread}</span>` : ''}
        `;
        container.appendChild(row);
    });

    // Auto-select first channel
    const firstRow = container.querySelector('.ch-row');
    if (firstRow) firstRow.click();
}

function renderCommunityEvents(communityId) {
    const container = document.getElementById('activeEventsList');
    if (!container) return;

    const events = window.NexusCRUD.getWhere('events', e => e.communityId === communityId);
    
    if (events.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-3); font-size:13px;">No active events yet</div>';
        return;
    }

    container.innerHTML = events.map(ev => {
        const date = new Date(ev.date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });

        return `
            <div class="event-mini" onclick="showEventDetailsModal('${ev.id}')">
                <div class="ev-date">
                    <div class="ev-mon">${month}</div>
                    <div class="ev-day">${day}</div>
                </div>
                <div class="ev-info">
                    <div class="ev-name">${ev.title}</div>
                    <div class="ev-meta">${ev.time} · ${ev.attendees} attending</div>
                </div>
                <span class="ev-badge">${ev.status}</span>
            </div>
        `;
    }).join('');
}

// --- 3. INTERACTIVE LOGIC ---
window.selectChannel = function (row, channelName, description) {
    document.querySelectorAll('.ch-row').forEach(r => r.classList.remove('active-ch'));
    if (row) row.classList.add('active-ch');
    
    const activeCh = document.getElementById('activeCh');
    const activeChDesc = document.getElementById('activeChDesc');
    
    if (activeCh) activeCh.textContent = channelName;
    if (activeChDesc) activeChDesc.textContent = description || "Welcome to the channel!";
};

window.toggleMainJoin = function () {
    const comm = getActiveCommunity();
    const btn = document.getElementById('joinMainBtn');
    if (!btn || !comm) return;

    let joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const isJoined = joinedList.includes(comm.slug);

    if (isJoined) {
        joinedList = joinedList.filter(s => s !== comm.slug);
        btn.classList.remove('joined');
        btn.textContent = "+ Join Community";
        btn.style.background = "linear-gradient(135deg, var(--accent), var(--accent-hover))";
    } else {
        joinedList.push(comm.slug);
        btn.classList.add('joined');
        btn.textContent = "✓ Joined";
        btn.style.background = "var(--success)";
        if (window.toast) window.toast(`Welcome to ${comm.name}! 🚀`);
    }

    localStorage.setItem('nexus_joined_communities', JSON.stringify(joinedList));
};

function initJoinState(slug) {
    const btn = document.getElementById('joinMainBtn');
    if (!btn) return;
    
    const joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const isJoined = joinedList.includes(slug);

    if (isJoined) {
        btn.classList.add('joined');
        btn.textContent = "✓ Joined";
        btn.style.background = "var(--success)";
    } else {
        btn.classList.remove('joined');
        btn.textContent = "+ Join Community";
        btn.style.background = "linear-gradient(135deg, var(--accent), var(--accent-hover))";
    }
}

window.showEventDetailsModal = function(eventId) {
    const ev = window.NexusCRUD.getById('events', eventId);
    if (!ev) return;
    
    // Existing modal logic can go here or redirect
    window.location.href = `events.html?id=${ev.id}`;
};

window.switchTab = function (tabName, btn) {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');
};

// --- 4. STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure store is ready
    if (window.NexusData) window.NexusData.getStore();
    
    renderCommunityData();
    console.log("%c[CommunityPage] %cReady.", "color: #5B6EF5; font-weight: bold;", "color: #10B981;");
});
