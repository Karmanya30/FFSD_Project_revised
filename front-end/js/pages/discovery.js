/**
 * Gameunity — Community Discovery Logic
 * Handles dynamic data rendering, category filtering, and real-time search.
 */

// --- 1. STATE ---
let activeCategory = 'all';
let searchQuery = '';

// --- 2. DYNAMIC RENDERING ---
function renderCommunities() {
    updateHeroStats();
    const grid = document.getElementById('commGrid');
    if (!grid) return;

    const allCommunities = window.NexusCRUD.getAll('communities');
    const joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '["pro-gamers"]');

    // Filter by category and search query
    const filtered = allCommunities.filter(c => {
        const matchesCat = activeCategory === 'all' || c.category.toLowerCase() === activeCategory;
        const matchesSearch = !searchQuery || 
            c.name.toLowerCase().includes(searchQuery) || 
            c.description.toLowerCase().includes(searchQuery);
        return matchesCat && matchesSearch;
    });

    // Update count display
    const countDisplay = document.getElementById('gridCount');
    if (countDisplay) {
        countDisplay.textContent = `Showing ${filtered.length} of ${allCommunities.length}`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-3);">No communities found matching your criteria.</div>';
        return;
    }

    grid.innerHTML = filtered.map((c, index) => {
        const isJoined = joinedList.includes(c.slug);
        const bannerClass = c.grad ? c.grad.replace('grad-', 'banner-') : 'banner-purple';
        
        return `
            <div class="c-card delay-${(index % 10) * 5}" onclick="navigateToCommunity(event, '${c.slug}')">
                <div class="c-banner ${bannerClass}">
                    <div class="c-banner-inner">${c.icon}${c.icon}${c.icon}</div>
                </div>
                <div class="c-card-body">
                    <div class="c-top">
                        <div class="c-icon ${c.grad}">${c.icon}</div>
                        <div class="c-badges">
                            ${c.members > 15000 ? '<span class="c-badge badge-trending">🔥 Trending</span>' : ''}
                            ${c.online > 1000 ? '<span class="c-badge badge-hot">⭐ Hot</span>' : ''}
                        </div>
                    </div>
                    <div>
                        <div class="c-name">${c.name}</div>
                        <div class="c-cat">${c.category} · Platform</div>
                    </div>
                    <div class="c-desc">${c.description}</div>
                    <div class="c-footer">
                        <div class="c-stats">
                            <span class="c-stat">👥 ${c.members.toLocaleString()}</span>
                            <span class="c-stat">🟢 ${c.online.toLocaleString()} online</span>
                        </div>
                        <button class="btn-join ${isJoined ? 'joined' : ''}" onclick="toggleJoin(event, '${c.slug}')">
                            ${isJoined ? '✓ Joined' : 'Join'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateHeroStats() {
    const allCommunities = window.NexusCRUD.getAll('communities');
    const totalMembers = allCommunities.reduce((sum, c) => sum + c.members, 0);
    const totalOnline = allCommunities.reduce((sum, c) => sum + c.online, 0);
    const allEvents = window.NexusCRUD.getAll('events');

    const stats = document.querySelectorAll('.h-stat strong');
    if (stats.length >= 4) {
        stats[0].textContent = allCommunities.length.toLocaleString();
        stats[1].textContent = (totalMembers / 1000).toFixed(1) + 'k'; 
        stats[2].textContent = totalOnline.toLocaleString();
        stats[3].textContent = allEvents.length + '+';
    }
}

// --- 3. EVENT HANDLERS ---
window.setChip = function(el, category) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    activeCategory = category.toLowerCase();
    renderCommunities();
};

window.filterCards = function() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    renderCommunities();
};

window.toggleJoin = function(event, slug) {
    event.stopPropagation(); // Prevent card click navigation
    const btn = event.currentTarget;
    let joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '["pro-gamers"]');
    const isJoined = joinedList.includes(slug);

    if (isJoined) {
        joinedList = joinedList.filter(s => s !== slug);
        btn.classList.remove('joined');
        btn.textContent = 'Join';
    } else {
        joinedList.push(slug);
        btn.classList.add('joined');
        btn.textContent = '✓ Joined';
        const comm = window.NexusCRUD.getAll('communities').find(c => c.slug === slug);
        if (window.toast) window.toast(`Welcome to ${comm.name}! ⚡`);
    }

    localStorage.setItem('nexus_joined_communities', JSON.stringify(joinedList));
    
    // Update the dashboard counts if possible
    if (window.renderDashboard) window.renderDashboard();
    updateHeroStats();
};

window.navigateToCommunity = function(event, slug) {
    if (event.target.tagName === 'BUTTON') return;
    window.location.href = `community-page.html?name=${slug}`;
};

// --- 4. STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure store is ready
    if (window.NexusData) window.NexusData.getStore();
    
    renderCommunities();
    
    // Search focus shortcut
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
        }
    });

    console.log("%c[Discovery] %cSynchronized with Store.", "color: #5B6EF5; font-weight: bold;", "color: #10B981;");
});
