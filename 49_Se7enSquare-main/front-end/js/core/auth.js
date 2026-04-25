/**
 * Gameunity — Authentication & RBAC Logic
 * Handles session persistence via localStorage and Role-Based Access Control (RBAC).
 * 
 * ROLES (4 total):
 *   superuser — System Admin, full platform access
 *   mod       — System Moderator, end-user + mod panel
 *   gamer     — Regular user, can create/own communities
 *   audience  — View-only user
 * 
 * COMMUNITY OWNERSHIP:
 *   A gamer who creates a community becomes its Owner.
 *   Ownership is stored in localStorage as `nexus_owned_communities`.
 *   Owners see the Community Manager panel for that community only.
 *   Super Users can manage ANY community.
 */

// ==========================================
// 1. ROLE HIERARCHY
// ==========================================

/**
 * Role power levels — higher number = more access
 */
const ROLE_LEVELS = {
    audience:  1,
    gamer:     2,
    mod:       3,
    superuser: 4
};

/**
 * Page-level access rules — which roles can access each page
 */
const PAGE_ACCESS = {
    'dashboard.html':           ['audience', 'gamer', 'mod', 'superuser'],
    'discovery.html':           ['audience', 'gamer', 'mod', 'superuser'],
    'events.html':              ['audience', 'gamer', 'mod', 'superuser'],
    'chat.html':                ['audience', 'gamer', 'mod', 'superuser'],
    'profile-settings.html':    ['audience', 'gamer', 'mod', 'superuser'],
    'community-page.html':      ['audience', 'gamer', 'mod', 'superuser'],
    'create-community.html':    ['gamer', 'mod', 'superuser'],
    'community-manager.html':   ['gamer', 'superuser'],  // gamer only if they own the community
    'mod-panel.html':           ['mod', 'superuser'],
    'superuser-dashboard.html': ['superuser'],
    'report.html':              ['audience', 'gamer', 'mod', 'superuser'],
    'appeal.html':              ['audience', 'gamer', 'mod', 'superuser'],
};

// ==========================================
// 2. SESSION MANAGEMENT
// ==========================================

/**
 * Initializes a user session
 * @param {string} username 
 * @param {string} role - 'superuser', 'mod', 'gamer', or 'audience'
 */
function loginUser(username, role) {
    const user = { 
        username, 
        role, 
        loginTime: new Date().toISOString(),
        token: `mock_token_${Math.random().toString(36).substr(2)}`
    };
    
    localStorage.setItem('nexus_user', JSON.stringify(user));
    
    console.log(`%c[AUTH] %cLogged in as: ${username} (${role})`, "color: #10B981; font-weight: bold;", "color: #fff;");
    return user;
}

/**
 * Retrieves the currently logged-in user object
 * @returns {Object|null}
 */
function getCurrentUser() {
    const session = localStorage.getItem('nexus_user');
    if (!session) return null;
    
    try {
        return JSON.parse(session);
    } catch (e) {
        console.error("Malformed session data. Clearing storage.");
        localStorage.removeItem('nexus_user');
        return null;
    }
}

/**
 * Clears the session and redirects to the landing page
 */
function logoutUser() {
    localStorage.removeItem('nexus_user');
    
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
 * @param {Array} allowedRoles - e.g., ['mod', 'superuser']
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

    // 2. Super User bypasses all role checks
    if (user.role === 'superuser') return true;

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
 * Super User always has permission.
 * @param {string|Array} roles - single role string or array of roles
 */
function hasPermission(roles) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'superuser') return true;
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

    // Super User can manage any community
    if (user.role === 'superuser') return true;

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

    // Mod Panel — mod + superuser
    if (user.role === 'mod' || user.role === 'superuser') {
        panels.push({
            id: 'mod-panel',
            label: 'Mod Panel',
            icon: '🛡️',
            href: 'mod-panel.html',
            badgeClass: 'rbac-badge-mod'
        });
    }

    // Super User Dashboard — superuser only
    if (user.role === 'superuser') {
        panels.push({
            id: 'super-dashboard',
            label: 'System Admin',
            icon: '🔴',
            href: 'superuser-dashboard.html',
            badgeClass: 'rbac-badge-super'
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
        superuser: { label: 'SUPER USER', icon: '🛡️', color: '#ef4444' },
        mod:       { label: 'MODERATOR',  icon: '🔍', color: '#f59e0b' },
        gamer:     { label: 'GAMER',      icon: '🎮', color: '#8b5cf6' },
        audience:  { label: 'AUDIENCE',   icon: '👀', color: '#64748b' }
    };
    return displays[role] || displays.audience;
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