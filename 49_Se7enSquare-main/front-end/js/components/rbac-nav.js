/**
 * Gameunity — RBAC Sidebar Navigation Component
 * 
 * Auto-injects role-based panel links into the app-rail sidebar.
 * Reads user session from localStorage and shows/hides panel links
 * based on the user's role.
 * 
 * Usage: Include this script on any page with an .app-rail sidebar.
 *        <script src="../js/core/auth.js"></script>
 *        <script src="../js/components/rbac-nav.js"></script>
 */

(function initRBACNav() {
    document.addEventListener('DOMContentLoaded', () => {
        const user = window.getCurrentUser ? window.getCurrentUser() : null;
        if (!user) return;

        injectRolePanelLinks(user);
        updateAvatarFromSession(user);
        updateGreetingFromSession(user);
        enforcePageAccess(user);

        console.log(`%c[RBAC] %cNav initialized for: ${user.username} (${user.role})`, 
            "color: #f59e0b; font-weight: bold;", "color: #aaa;");
    });

    /**
     * Injects role-specific panel links into the app-rail sidebar
     */
    function injectRolePanelLinks(user) {
        const rail = document.querySelector('.app-rail');
        if (!rail) return;

        const panels = window.getAccessiblePanels ? window.getAccessiblePanels() : [];
        if (panels.length === 0 && user.role !== 'gamer') {
            // No panels + not a gamer, just show the badge
            injectRoleBadge(rail, user);
            return;
        }

        // Find the insertion point — after the last .rail-divider before communities
        const dividers = rail.querySelectorAll('.rail-divider');
        let insertionPoint = null;

        if (dividers.length >= 2) {
            // Insert before the second divider (which separates nav from communities)
            insertionPoint = dividers[1];
        } else if (dividers.length === 1) {
            insertionPoint = dividers[0].nextSibling;
        }

        if (panels.length > 0) {
            // Create panel section
            const section = document.createElement('div');
            section.className = 'rbac-section';
            section.id = 'rbac-panel-section';

            // Divider with label
            const divider = document.createElement('div');
            divider.className = 'rbac-divider';
            section.appendChild(divider);

            const label = document.createElement('div');
            label.className = 'rbac-divider-label';
            label.textContent = 'Panels';
            section.appendChild(label);

            // Panel links
            const currentPage = window.location.pathname.split('/').pop();

            panels.forEach((panel, index) => {
                const link = document.createElement('a');
                link.href = panel.href;
                link.className = `rbac-panel-link rbac-link-${panel.id.includes('super') ? 'super' : 'mod'}`;
                link.setAttribute('data-tooltip', panel.label);
                link.textContent = panel.icon;
                link.style.animationDelay = `${index * 0.1}s`;

                // Mark active
                if (currentPage === panel.href) {
                    link.classList.add('active');
                }

                section.appendChild(link);
            });

            if (insertionPoint) {
                rail.insertBefore(section, insertionPoint);
            } else {
                // Fallback: insert before rail-footer
                const footer = rail.querySelector('.rail-footer');
                if (footer) {
                    rail.insertBefore(section, footer);
                } else {
                    rail.appendChild(section);
                }
            }
        }

        // Always show the role badge
        injectRoleBadge(rail, user);
    }

    /**
     * Injects a role badge below the avatar in the sidebar footer
     */
    function injectRoleBadge(rail, user) {
        const footer = rail.querySelector('.rail-footer');
        if (!footer) return;

        // Don't add if already exists
        if (footer.querySelector('.rbac-role-badge')) return;

        const roleInfo = window.getRoleDisplay ? window.getRoleDisplay(user.role) : null;
        if (!roleInfo) return;

        const badge = document.createElement('div');
        badge.className = `rbac-role-badge rbac-badge-${user.role}`;
        badge.textContent = roleInfo.label;

        footer.appendChild(badge);
    }

    /**
     * Updates avatar initials across the page from session data
     */
    function updateAvatarFromSession(user) {
        const initials = getInitials(user.username);

        // Update sidebar avatar
        const railAvatar = document.querySelector('.rail-avatar');
        if (railAvatar) {
            // Preserve child elements like status dots
            const childNodes = Array.from(railAvatar.childNodes);
            const nonTextChildren = childNodes.filter(n => n.nodeType !== 3); // keep non-text nodes
            railAvatar.textContent = initials;
            nonTextChildren.forEach(child => railAvatar.appendChild(child));
        }

        // Update header avatar
        const headerAvatar = document.querySelector('.header-avatar');
        if (headerAvatar) {
            headerAvatar.textContent = initials;
        }
    }

    /**
     * Updates greeting text if present on the page
     */
    function updateGreetingFromSession(user) {
        const greetingName = document.querySelector('.greeting-name');
        if (greetingName) {
            const hour = new Date().getHours();
            let timeGreeting = 'Good morning';
            if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
            else if (hour >= 17) timeGreeting = 'Good evening';

            greetingName.textContent = `${timeGreeting}, ${user.username} 👋`;
        }
    }

    /**
     * Enforces page-level access based on the current page and user role
     */
    function enforcePageAccess(user) {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Don't enforce on login/landing/appeal/report pages
        const publicPages = ['login.html', 'landing.html', 'appeal.html', 'report.html', ''];
        if (publicPages.includes(currentPage)) return;

        // For community-manager.html, check ownership
        if (currentPage === 'community-manager.html') {
            if (user.role === 'superuser') return; // Super user can access all
            
            // Get community name from URL
            const params = new URLSearchParams(window.location.search);
            const communityName = params.get('name') || params.get('community') || '';
            
            if (user.role === 'gamer' && communityName) {
                if (window.isOwnerOfCommunity && window.isOwnerOfCommunity(communityName)) {
                    return; // Owner can access
                }
            }
            
            // Not authorized
            console.error(`[RBAC] Access denied to community-manager for role: ${user.role}`);
            window.location.href = 'dashboard.html?error=forbidden';
            return;
        }

        // General page access check using requireRole if available
        const pageAccess = {
            'superuser-dashboard.html': ['superuser'],
            'mod-panel.html': ['mod', 'superuser'],
            'create-community.html': ['gamer', 'mod', 'superuser']
        };

        if (pageAccess[currentPage]) {
            if (window.requireRole) {
                window.requireRole(pageAccess[currentPage]);
            }
        }
    }

    /**
     * Helper: Get initials from a username
     */
    function getInitials(username) {
        if (!username) return '??';
        const parts = username.split(/[\s._-]+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return username.substring(0, 2).toUpperCase();
    }
})();
