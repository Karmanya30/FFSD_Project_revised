/**
 * Gameunity — Authentication & RBAC Logic
 * Handles session persistence via localStorage and Role-Based Access Control (RBAC).
 * 
 * ROLES (3 total):
 *   admin     — System Admin, full platform access
 *   moderator — System Moderator, end-user + mod panel
 *   gamer     — Regular user, can create/own communities
 * 
 * COMMUNITY OWNERSHIP:
 *   A gamer who creates a community becomes its Owner.
 *   Ownership is stored in localStorage as `nexus_owned_communities`.
 *   Owners see the Community Manager panel for that community only.
 *   Admin can manage ANY community.
 *
 * Store final role in: localStorage.getItem("role")
 */

// ==========================================
// 1. ROLE HIERARCHY
// ==========================================

/**
 * Role power levels — higher number = more access
 */
const ROLE_LEVELS = {
    gamer:     1,
    moderator: 2,
    admin:     3
};

/**
 * Page-level access rules — which roles can access each page
 */
const PAGE_ACCESS = {
    'dashboard.html':           ['gamer', 'moderator', 'admin'],
    'discovery.html':           ['gamer', 'moderator', 'admin'],
    'events.html':              ['gamer', 'moderator', 'admin'],
    'chat.html':                ['gamer', 'moderator', 'admin'],
    'profile-settings.html':    ['gamer', 'moderator', 'admin'],
    'community-page.html':      ['gamer', 'moderator', 'admin'],
    'create-community.html':    ['gamer', 'moderator', 'admin'],
    'community-manager.html':   ['gamer', 'admin'],  // gamer only if they own the community
    'mod-panel.html':           ['moderator', 'admin'],
    'admin-dashboard.html':     ['admin'],
    'report.html':              ['gamer', 'moderator', 'admin'],
    'appeal.html':              ['gamer', 'moderator', 'admin'],
};

// ==========================================
// 2. SESSION MANAGEMENT
// ==========================================

/**
 * Initializes a user session
 * @param {string} username 
 * @param {string} role - 'admin', 'moderator', or 'gamer'
 */
function loginUser(username, role) {
    // Assign role directly
    const normalizedRole = role;

    const user = { 
        username, 
        role: normalizedRole, 
        loginTime: new Date().toISOString(),
        token: `mock_token_${Math.random().toString(36).substr(2)}`
    };
    
    localStorage.setItem('nexus_user', JSON.stringify(user));
    localStorage.setItem('role', normalizedRole);
    
    console.log(`%c[AUTH] %cLogged in as: ${username} (${normalizedRole})`, "color: #10B981; font-weight: bold;", "color: #fff;");
    return user;
}

/**
 * Retrieves the currently logged-in user object and normalizes the role
 * @returns {Object|null}
 */
function getCurrentUser() {
    const session = localStorage.getItem('nexus_user');
    if (!session) return null;
    
    try {
        const user = JSON.parse(session);
        localStorage.setItem('role', user.role); // Sync to global role
        return user;
    } catch (e) {
        console.error("Malformed session data. Clearing storage.");
        localStorage.removeItem('nexus_user');
        localStorage.removeItem('role');
        return null;
    }
}

/**
 * Clears the session and redirects to the landing page
 */
function logoutUser() {
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('role');
    
    if (window.toast) window.toast("Logging out...");
    
    setTimeout(() => {
        window.location.href = 'landing.html';
    }, 500);
}

// ==========================================
// 3. ROUTE PROTECTION (RBAC)
// ==========================================

/**
 * Acts as a Gatekeeper for protected pages.
 * Use this at the top of your page-specific JS files.
 * @param {Array} allowedRoles - e.g., ['moderator', 'admin']
 * @returns {boolean}
 */
function requireRole(allowedRoles) {
    const user = getCurrentUser();

    // 1. No user found
    if (!user) {
        console.warn("[AUTH] Unauthenticated access attempt.");
        window.location.href = 'login.html?error=unauthorized';
        return false;
    }

    // 2. Admin bypasses all role checks
    if (user.role === 'admin') return true;

    // 3. Role check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.error(`[AUTH] Access Denied. User role: ${user.role}. Required: ${allowedRoles}`);
        window.location.href = 'dashboard.html?error=forbidden';
        return false;
    }

    return true;
}

/**
 * Non-blocking check for UI elements (e.g., showing/hiding buttons)
 * Admin always has permission.
 * @param {string|Array} roles - single role string or array of roles
 */
function hasPermission(roles) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
}

/**
 * Get the numeric power level for a role
 * @param {string} role
 * @returns {number}
 */
function getRoleLevel(role) {
    return ROLE_LEVELS[role] || 0;
}

/**
 * Check if the current user's role is at least the given level
 * @param {string} minimumRole
 * @returns {boolean}
 */
function hasMinimumRole(minimumRole) {
    const user = getCurrentUser();
    if (!user) return false;
    return getRoleLevel(user.role) >= getRoleLevel(minimumRole);
}

// ==========================================
// 4. COMMUNITY OWNERSHIP
// ==========================================

/**
 * Get list of community names the current user owns
 * @returns {Array<string>}
 */
function getOwnedCommunities() {
    try {
        const data = localStorage.getItem('nexus_owned_communities');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Check if the current user is the owner of a specific community
 * @param {string} communityName - e.g., 'pro-gamers'
 * @returns {boolean}
 */
function isOwnerOfCommunity(communityName) {
    const user = getCurrentUser();
    if (!user) return false;

    // Admin can manage any community
    if (user.role === 'admin') return true;

    // Only gamers can own communities
    if (user.role !== 'gamer') return false;

    const owned = getOwnedCommunities();
    return owned.includes(communityName.toLowerCase());
}

/**
 * Register a community as owned by the current user
 * @param {string} communityName
 */
function addOwnedCommunity(communityName) {
    const owned = getOwnedCommunities();
    const name = communityName.toLowerCase();
    if (!owned.includes(name)) {
        owned.push(name);
        localStorage.setItem('nexus_owned_communities', JSON.stringify(owned));
    }
}

/**
 * Get the panels the current user can access based on their role
 * @returns {Array<Object>} - [{id, label, icon, href}]
 */
function getAccessiblePanels() {
    const user = getCurrentUser();
    if (!user) return [];

    const panels = [];

    // Mod Panel — moderator only
    if (user.role === 'moderator' || user.role === 'admin') {
        panels.push({
            id: 'mod-panel',
            label: 'Mod Panel',
            icon: '🛡️',
            href: 'mod-panel.html',
            badgeClass: 'rbac-badge-mod'
        });
    }

    // Admin Dashboard — admin only
    if (user.role === 'admin') {
        panels.push({
            id: 'admin-dashboard',
            label: 'System Admin',
            icon: '🔴',
            href: 'admin-dashboard.html',
            badgeClass: 'rbac-badge-admin'
        });
    }

    return panels;
}

/**
 * Get role display info
 * @param {string} role
 * @returns {Object} - {label, icon, color}
 */
function getRoleDisplay(role) {
    const displays = {
        admin:     { label: 'ADMIN',      icon: '🛡️', color: '#ef4444' },
        moderator: { label: 'MODERATOR',  icon: '🔍', color: '#f59e0b' },
        gamer:     { label: 'GAMER',      icon: '🎮', color: '#8b5cf6' }
    };
    return displays[role] || displays.gamer;
}

// ==========================================
// 5. AUTO-INITIALIZATION
// ==========================================

// This runs on every page that imports this module
(function initAuth() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('error') && window.toast) {
        const err = params.get('error');
        if (err === 'forbidden') window.toast("🚫 You don't have permission to access that.");
        if (err === 'unauthorized') window.toast("🔒 Please log in to continue.");
    }
})();

// Make functions globally available (non-module script usage)
window.loginUser = loginUser;
window.getCurrentUser = getCurrentUser;
window.logoutUser = logoutUser;
window.requireRole = requireRole;
window.hasPermission = hasPermission;
window.hasMinimumRole = hasMinimumRole;
window.getRoleLevel = getRoleLevel;
window.getOwnedCommunities = getOwnedCommunities;
window.isOwnerOfCommunity = isOwnerOfCommunity;
window.addOwnedCommunity = addOwnedCommunity;
window.getAccessiblePanels = getAccessiblePanels;
window.getRoleDisplay = getRoleDisplay;
window.ROLE_LEVELS = ROLE_LEVELS;