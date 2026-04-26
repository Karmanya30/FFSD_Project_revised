/**
 * DEPRECATED/TODO - navbar.js
 * AUDIT FIX: This file is currently orphaned and not imported by any HTML page.
 * Keep for reference if backend integration is planned, otherwise safe to delete.
 */
/**
 * Gameunity — Global Navigation & Auth UI Logic
 * Handles user session display, logout procedures, and active link highlighting.
 */

// ==========================================
// 1. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    highlightActiveNav();
});

// ==========================================
// 2. AUTHENTICATION UI
// ==========================================

/**
 * Injects user information into the navbar and sets up logout listeners
 */
function updateAuthUI() {
    // 1. Get user from core auth module
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

    // 2. Target the profile section (Sidebar footer or Topbar)
    const profileSection = document.getElementById('nav-profile-section');
    if (!profileSection || !user) return;

    // 3. Render user-specific UI
    // Using textContent for name to prevent XSS
    profileSection.innerHTML = `
        <div class="user-info">
            <div class="user-name">${escapeHTML(user.username)}</div>
            <div class="user-status">${user.role === 'admin' ? '🛡️ Admin' : '👤 Member'}</div>
        </div>
        <button id="logout-btn" class="btn-logout" title="Exit Session">Logout</button>
    `;

    // 4. Attach Logout Event
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

/**
 * Handles the logout flow with a UI confirmation
 */
function handleLogout() {
    if (window.toast) window.toast("Logging out... See you soon! 👋");

    // Simulate minor delay for smooth transition
    setTimeout(() => {
        if (typeof logoutUser === 'function') {
            logoutUser();
        } else {
            // Fallback if core module is missing
            localStorage.removeItem('nexus_user');
            localStorage.removeItem('nexus_owned_communities');
            window.location.href = 'landing.html';
        }
    }, 600);
}

// ==========================================
// 3. NAVIGATION UTILITIES
// ==========================================

/**
 * Automatically adds the 'active' class to the nav-item matching the current page
 */
function highlightActiveNav() {
    const currentPath = window.location.pathname.split("/").pop();
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPath) {
            item.classList.add('active');
        } else {
            // Remove active if it was hardcoded in HTML but doesn't match
            if (currentPath !== "" && href !== "#") {
                item.classList.remove('active');
            }
        }
    });
}

// ==========================================
// 4. HELPERS
// ==========================================

/**
 * Simple XSS protection for injected usernames
 */
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}
