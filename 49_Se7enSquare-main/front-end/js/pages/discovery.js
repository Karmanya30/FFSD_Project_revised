import { api } from '../core/api.js';

// ==========================================
// 1. STATE & CONFIG
// ==========================================
let activeCategory = 'all';
let searchTimeout;
let sortModes = ['Popular', 'A-Z', 'Z-A']; 
let currentSortIndex = 0;                  
let hiddenCommunities = []; 
let allCommunities = []; // Store fetched communities

// ==========================================
// 2. FILTERING ENGINE
// ==========================================

/**
 * Cycles through the sorting modes and triggers a re-filter/sort
 */
window.toggleSort = function() {
    currentSortIndex = (currentSortIndex + 1) % sortModes.length;
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
        sortBtn.innerHTML = `⇅ Sort: ${sortModes[currentSortIndex]}`;
    }
    applyFilters();
};

/**
 * Sets the active category chip and triggers a re-filter
 */
window.setChip = function(el, category) {
    // UI: Active State
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    
    activeCategory = category;
    applyFilters();
};

/**
 * Orchestrates both Category and Search Query filtering, plus Sorting
 */
function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.c-card');
    const featuredBanner = document.getElementById('featuredBanner');
    let visibleCount = 0;

    // Convert NodeList to Array so we can sort it
    const cardsArray = Array.from(cards);

    // 1. Filter Pass
    cardsArray.forEach(card => {
        const cardCat = card.dataset.cat;
        const matchesCategory = (activeCategory === 'all' || cardCat === activeCategory);

        const name = card.querySelector('.c-name').textContent.toLowerCase();
        const desc = card.querySelector('.c-desc').textContent.toLowerCase();
        const tags = card.querySelector('.c-cat').textContent.toLowerCase();
        const matchesQuery = !query || [name, desc, tags].some(text => text.includes(query));

        const shouldShow = matchesCategory && matchesQuery;
        card.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) visibleCount++;
    });

    // 2. Sort Pass
    cardsArray.sort((a, b) => {
        if (sortModes[currentSortIndex] === 'Popular') {
            // Extract numbers from "👥 2,451" for sorting
            const getMembers = (card) => {
                const text = card.querySelector('.c-stats .c-stat').textContent;
                return parseInt(text.replace(/[^\d]/g, ''), 10) || 0;
            };
            return getMembers(b) - getMembers(a); // High to low
            
        } else if (sortModes[currentSortIndex] === 'A-Z') {
            const aName = a.querySelector('.c-name').textContent;
            const bName = b.querySelector('.c-name').textContent;
            return aName.localeCompare(bName);
            
        } else if (sortModes[currentSortIndex] === 'Z-A') {
            const aName = a.querySelector('.c-name').textContent;
            const bName = b.querySelector('.c-name').textContent;
            return bName.localeCompare(aName);
        }
        return 0;
    });

    // 3. Re-append sorted elements to the DOM
    const grid = document.getElementById('commGrid');
    cardsArray.forEach(card => grid.appendChild(card));

    // Update Counter
    const countDisplay = document.getElementById('gridCount');
    if (countDisplay) {
        countDisplay.textContent = `Showing ${visibleCount} of 50,214`;
    }

    // Contextual Featured Banner Visibility
    if (featuredBanner) {
        const relevantToAI = ['all', 'tech', 'science'].includes(activeCategory);
        featuredBanner.style.display = relevantToAI ? 'flex' : 'none';
    }
}

// Debounced version of filter for input performance
window.filterCards = function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 150);
};

// ==========================================
// 3. JOIN LOGIC
// ==========================================

window.toggleJoin = function(btn) {
    const isJoined = btn.classList.contains('joined');
    const cardBody = btn.closest('.c-card-body');
    const name = cardBody.querySelector('.c-name').textContent;
    const appRail = document.querySelector('.app-rail');
    
    if (isJoined) {
        // --- UN-JOIN LOGIC ---
        btn.classList.remove('joined');
        btn.textContent = 'Join';
        
        // Find the community in the sidebar and remove it
        const commToRemove = Array.from(appRail.querySelectorAll('.rail-comm')).find(
            c => c.getAttribute('data-tooltip') === name
        );
        
        if (commToRemove) {
            commToRemove.remove();
            
            // If there's space (< 6) and we have communities in memory, restore the last one
            const currentComms = appRail.querySelectorAll('.rail-comm');
            if (currentComms.length < 6 && hiddenCommunities.length > 0) {
                const restoredData = hiddenCommunities.pop(); // Get the last hidden item
                
                const restoredComm = document.createElement('a');
                restoredComm.href = restoredData.href;
                restoredComm.className = restoredData.className;
                restoredComm.setAttribute('data-tooltip', restoredData.tooltip);
                restoredComm.innerHTML = restoredData.innerHTML;
                
                // Insert it exactly before the "Create Community" button
                const createBtn = appRail.querySelector('[data-tooltip="Create Community"]');
                appRail.insertBefore(restoredComm, createBtn);
            }
        }
    } else {
        // --- JOIN LOGIC ---
        btn.classList.add('joined');
        btn.textContent = '✓ Joined';
        
        const iconEl = cardBody.querySelector('.c-icon');
        const iconText = iconEl.textContent.trim();
        
        let bgClass = 'grad-purple'; 
        iconEl.classList.forEach(cls => {
            if (cls.startsWith('grad-') || cls.startsWith('u-extracted-')) {
                bgClass = cls;
            }
        });

        const existingComms = appRail.querySelectorAll('.rail-comm');
        let alreadyExists = Array.from(existingComms).some(c => c.getAttribute('data-tooltip') === name);

        if (!alreadyExists) {
            const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            
            const newComm = document.createElement('a');
            newComm.href = `community-page.html?name=${cleanName}`;
            newComm.className = `rail-item rail-comm ${bgClass}`;
            newComm.setAttribute('data-tooltip', name);
            newComm.innerHTML = `${iconText}<div class="rail-dot bg-dot-green"></div>`;
            
            if (existingComms.length > 0) {
                appRail.insertBefore(newComm, existingComms[0]);
            }
            
            const updatedComms = appRail.querySelectorAll('.rail-comm');
            if (updatedComms.length > 6) {
                const lastComm = updatedComms[updatedComms.length - 1];
                
                // SAVE TO MEMORY before deleting
                hiddenCommunities.push({
                    href: lastComm.getAttribute('href'),
                    className: lastComm.className,
                    tooltip: lastComm.getAttribute('data-tooltip'),
                    innerHTML: lastComm.innerHTML
                });
                
                lastComm.remove();
            }
        }

        if (window.toast) {
            window.toast(`Welcome to ${name}! ⚡`);
        }
    }
};

window.toggleJoinFeat = function(btn) {
    const featBanner = btn.closest('.featured-banner');
    const name = featBanner.querySelector('.feat-name').textContent;
    const appRail = document.querySelector('.app-rail');

    if (btn.textContent === '✓ Joined') {
        // --- UN-JOIN FEATURED ---
        btn.textContent = 'Join Community';
        btn.style.background = '';
        btn.style.boxShadow = '';

        const commToRemove = Array.from(appRail.querySelectorAll('.rail-comm')).find(
            c => c.getAttribute('data-tooltip') === name
        );
        
        if (commToRemove) {
            commToRemove.remove();
            
            const currentComms = appRail.querySelectorAll('.rail-comm');
            if (currentComms.length < 6 && hiddenCommunities.length > 0) {
                const restoredData = hiddenCommunities.pop();
                
                const restoredComm = document.createElement('a');
                restoredComm.href = restoredData.href;
                restoredComm.className = restoredData.className;
                restoredComm.setAttribute('data-tooltip', restoredData.tooltip);
                restoredComm.innerHTML = restoredData.innerHTML;
                
                const createBtn = appRail.querySelector('[data-tooltip="Create Community"]');
                appRail.insertBefore(restoredComm, createBtn);
            }
        }
    } else {
        // --- JOIN FEATURED ---
        btn.textContent = '✓ Joined';
        btn.style.background = 'linear-gradient(135deg, #34D399, #059669)';
        btn.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
        
        const iconText = featBanner.querySelector('.feat-icon').textContent.trim();
        const existingComms = appRail.querySelectorAll('.rail-comm');
        let alreadyExists = Array.from(existingComms).some(c => c.getAttribute('data-tooltip') === name);

        if (!alreadyExists) {
            const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const newComm = document.createElement('a');
            newComm.href = `community-page.html?name=${cleanName}`;
            newComm.className = `rail-item rail-comm grad-purple`; 
            newComm.setAttribute('data-tooltip', name);
            newComm.innerHTML = `${iconText}<div class="rail-dot bg-dot-green"></div>`;
            
            if (existingComms.length > 0) appRail.insertBefore(newComm, existingComms[0]);
            
            const updatedComms = appRail.querySelectorAll('.rail-comm');
            if (updatedComms.length > 6) {
                const lastComm = updatedComms[updatedComms.length - 1];
                hiddenCommunities.push({
                    href: lastComm.getAttribute('href'),
                    className: lastComm.className,
                    tooltip: lastComm.getAttribute('data-tooltip'),
                    innerHTML: lastComm.innerHTML
                });
                lastComm.remove();
            }
        }
    }
};

// ==========================================
// 4. KEYBOARD SHORTCUTS
// ==========================================

function handleShortcuts(e) {
    // CMD/CTRL + K to focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
}

// ==========================================
// 5. INITIALIZATION
// ==========================================

async function fetchCommunities() {
    const response = await api.get('/communities');
    if (response && Array.isArray(response)) {
        allCommunities = response;
        renderCommunities(allCommunities);
    }
}

function renderCommunities(communities) {
    const grid = document.getElementById('commGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    communities.forEach((comm, index) => {
        const card = document.createElement('div');
        card.className = `c-card delay-${(index % 5 + 1) * 5}`;
        card.dataset.cat = 'gaming'; // Defaulting for prototype
        
        card.innerHTML = `
            <div class="c-banner banner-cyan"><div class="c-banner-inner">🎮🎮🎮</div></div>
            <div class="c-card-body">
                <div class="c-top">
                    <div class="c-icon grad-cyan">🎮</div>
                    <div class="c-badges"><span class="c-badge badge-trending">🔥 Trending</span></div>
                </div>
                <div><div class="c-name">${comm.name}</div><div class="c-cat">${comm.tags.join(' · ')}</div></div>
                <div class="c-desc">${comm.description}</div>
                <div class="c-footer">
                    <div class="c-stats"><span class="c-stat">👥 1,240</span><span class="c-stat">🟢 156 online</span></div>
                    <button class="btn-join" onclick="toggleJoin(this)">Join</button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const cleanName = comm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            window.location.href = `community-page.html?name=${cleanName}&id=${comm.id}`;
        });
        
        grid.appendChild(card);
    });
    
    const countDisplay = document.getElementById('gridCount');
    if (countDisplay) {
        countDisplay.textContent = `Showing ${communities.length} of ${communities.length}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('keydown', handleShortcuts);
    fetchCommunities();
    console.log("Discovery module initialized. Press ⌘K to search.");
});
