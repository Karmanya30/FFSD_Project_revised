/**
 * Gameunity — Unified Role-Based Sidebar
 * =========================================
 * Architecture: section-based, role-inherited navigation.
 *
 * Tier hierarchy (additive):
 *   gamer             →  USER tier
 *   moderator         →  USER + MODERATION section
 *   admin             →  USER + MODERATION + ADMIN section
 *
 * Session key: localStorage['role'] and localStorage['nexus_user']
 * Roles used:  gamer | moderator | admin
 */

// ═══════════════════════════════════════════════════
// 1. NAVIGATION SCHEMA
//    Each section is { label, sectionId, items[] }
//    label = null  →  no visible separator (top-level)
// ═══════════════════════════════════════════════════

/** Items visible to every logged-in user */
const NAV_USER = {
  label: null,
  sectionId: 'main',
  items: [
    { id: 'dashboard', name: 'Dashboard', link: 'dashboard.html',        icon: '🏠' },
    { id: 'discovery', name: 'Discover',  link: 'discovery.html',         icon: '🔭' },
    { id: 'events',    name: 'Events',    link: 'events.html',             icon: '📅' },
    { id: 'chat',      name: 'Chat',      link: 'chat.html',               icon: '💬' },
    { id: 'profile',   name: 'Profile',   link: 'profile-settings.html',  icon: '⚙️' },
  ],
};

/** Moderation section — only moderator + admin */
const NAV_MOD = {
  label: 'Moderation',
  sectionId: 'moderator',
  items: [
    { id: 'mod-panel', name: 'Moderator Panel', link: 'mod-panel.html', icon: '🛡️', badge: 'MODERATOR' },
    { id: 'report',    name: 'Reports',   link: 'report.html',    icon: '🚩' },
  ],
};

/** Admin section — only admin */
const NAV_ADMIN = {
  label: 'Admin',
  sectionId: 'admin',
  items: [
        { id: 'admin-dash',name: 'Admin Dashboard',   link: 'admin-dashboard.html', icon: '⚡', badge: 'ADMIN' },
        { id: 'users',     name: 'User Management',   link: 'admin-dashboard.html#users',   icon: '👤' },
        { id: 'communities',name: 'Communities',       link: 'admin-dashboard.html#communities',   icon: '🏘️' },
        { id: 'audit',     name: 'Audit Logs',        link: 'admin-dashboard.html#audit',   icon: '📋' },
  ],
};

/**
 * Returns ordered section array for the given role.
 * gamer      →  [USER]
 * moderator  →  [USER] + [MOD]
 * admin      →  [USER] + [MOD] + [ADMIN]
 */
function _getSections(role) {
  const isModerator = role === 'moderator' || role === 'admin';
  const isAdmin     = role === 'admin';

  const sections = [NAV_USER];
  if (isModerator) sections.push(NAV_MOD);
  if (isAdmin)     sections.push(NAV_ADMIN);

  return sections;
}

// ═══════════════════════════════════════════════════
// 2. ROLE DISPLAY METADATA
// ═══════════════════════════════════════════════════

const ROLE_META = {
  gamer:     { tier: 'Gamer',       color: '#34d399', accent: '#34d399', badge: null     },
  moderator: { tier: 'Moderator',   color: '#818cf8', accent: '#6366f1', badge: 'MODERATOR'   },
  admin:     { tier: 'Admin',       color: '#f59e0b', accent: '#f59e0b', badge: 'ADMIN' },
};

// ═══════════════════════════════════════════════════
// 3. STATE
// ═══════════════════════════════════════════════════

let _collapsed  = localStorage.getItem('nexus_sidebar_collapsed') === 'true';
let _mobileOpen = false;

// ═══════════════════════════════════════════════════
// 4. RENDER HELPERS
// ═══════════════════════════════════════════════════

function _getActivePage() {
  return (window.location.pathname.split('/').pop() || 'dashboard.html').replace('.html', '');
}

function _renderItem(item) {
  const active = _getActivePage() === item.id;
  const badge  = item.badge
    ? `<span class="sb-badge sb-badge--${item.badge.toLowerCase()}">${item.badge}</span>`
    : '';
  return `
    <a href="${item.link}"
       class="sb-item${active ? ' sb-item--active' : ''}"
       data-id="${item.id}"
       data-sb-tooltip="${item.name}">
      <span class="sb-item__icon" aria-hidden="true">${item.icon}</span>
      <span class="sb-item__label">${item.name}</span>
      ${badge}
    </a>`;
}

function _renderSection(section) {
  const separator = section.label
    ? `<div class="sb-section-sep">
         <span class="sb-section-label">${section.label}</span>
       </div>`
    : '';
  return `
    <div class="sb-section" data-section="${section.sectionId}">
      ${separator}
      ${section.items.map(_renderItem).join('')}
    </div>`;
}

function _renderSidebar(user) {
  const role     = localStorage.getItem('role') || user?.role || 'gamer';
  let displayName = user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) || user?.username || 'Guest';
  
  // Compute initials based on what we have
  let initials = "U";
  if (user?.firstName || user?.lastName) {
      initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "");
  } else if (displayName !== 'Guest') {
      initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || displayName.slice(0, 2).toUpperCase();
  }
  
  const meta     = ROLE_META[role] || ROLE_META.gamer;
  const sections = _getSections(role);
  const colClass = _collapsed ? ' collapsed' : '';

  return `
    <!-- Backdrop (mobile) -->
    <div class="sb-backdrop" id="sbBackdrop"
         onclick="SidebarComponent.closeMobile()"></div>

    <!-- Sidebar -->
    <nav class="nexus-sidebar${colClass}" id="nexusSidebar"
         aria-label="Main navigation" role="navigation">

      <!-- ── Brand ── -->
      <div class="sb-brand">
        <div class="sb-brand__logo" onclick="location.href='dashboard.html'"
             aria-label="Go to dashboard">
          <span class="sb-brand__icon">🎮</span>
          <span class="sb-brand__name">Gameunity</span>
        </div>
        <button class="sb-toggle-btn" id="sbToggleBtn"
                onclick="SidebarComponent.toggle(event)"
                aria-label="Toggle sidebar">
          <svg class="sb-toggle-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- ── Navigation ── -->
      <div class="sb-nav" role="list">
        ${sections.map(_renderSection).join('')}
      </div>

      <!-- ── User Profile (sticky bottom) ── -->
      <div class="sb-profile" id="sbProfile">
        <div class="sb-profile__av${meta.accent ? '' : ''}"
             onclick="location.href='profile-settings.html'"
             style="${meta.accent ? `box-shadow:0 0 0 2px ${meta.accent}55` : ''}">
          ${initials}
        </div>
        <div class="sb-profile__info">
          <div class="sb-profile__name">${displayName}</div>
          <div class="sb-profile__role" style="color:${meta.color}">
            ${meta.badge
              ? `<span class="sb-profile__badge"
                       style="background:${meta.color}18;
                              border-color:${meta.color}40;
                              color:${meta.color}">
                   ${meta.badge}
                 </span>`
              : ''}
            <span>${meta.tier}</span>
          </div>
        </div>
        <button class="sb-profile__logout"
                onclick="typeof logoutUser === 'function' ? logoutUser() : (location.href='login.html')"
                aria-label="Log out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

    </nav>

    <!-- Mobile hamburger (small screens only) -->
    <button class="sb-mobile-open" id="sbMobileOpen"
            onclick="SidebarComponent.openMobile()"
            aria-label="Open navigation">
      <span></span><span></span><span></span>
    </button>`;
}

// ═══════════════════════════════════════════════════
// 5. PUBLIC API  →  window.SidebarComponent
// ═══════════════════════════════════════════════════

window.SidebarComponent = {

  init() {
    const el = document.getElementById('sidebar-container');
    if (!el) return;

    let user = null;
    try {
      const raw = localStorage.getItem('nexus_user');
      user = raw ? JSON.parse(raw) : null;
    } catch (e) { /* ignore */ }

    el.innerHTML = _renderSidebar(user);
    this._applyCollapsed();
    this._bindKeys();
    console.log('%c[Sidebar]%c ready — role: %s',
      'color:#6366f1;font-weight:700', 'color:#9ca3af',
      user?.role || 'guest');
  },

  /** Toggle collapse / expand */
  toggle(e) {
    if (e) e.stopPropagation();
    _collapsed = !_collapsed;
    localStorage.setItem('nexus_sidebar_collapsed', _collapsed);
    this._applyCollapsed();
  },

  openMobile() {
    _mobileOpen = true;
    const sb = document.getElementById('nexusSidebar');
    const bd = document.getElementById('sbBackdrop');
    if (sb) sb.classList.add('mobile-open');
    if (bd) bd.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  closeMobile() {
    _mobileOpen = false;
    const sb = document.getElementById('nexusSidebar');
    const bd = document.getElementById('sbBackdrop');
    if (sb) sb.classList.remove('mobile-open');
    if (bd) bd.classList.remove('visible');
    document.body.style.overflow = '';
  },

  /** Change role for demo purposes */
  switchRole(role) {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('nexus_user') || '{}'); } catch (e) { /* ignore */ }
    user.role = role;
    if (!user.username) user.username = 'Demo User';
    localStorage.setItem('nexus_user', JSON.stringify(user));
    localStorage.setItem('role', role);
    window.location.reload();
  },

  // ── Private ──

  _applyCollapsed() {
    const sb  = document.getElementById('nexusSidebar');
    const btn = document.getElementById('sbToggleBtn');
    if (!sb) return;
    sb.classList.toggle('collapsed', _collapsed);
    if (btn) btn.classList.toggle('rotated', _collapsed);
  },

  _bindKeys() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && _mobileOpen) {
        this.closeMobile();
      }
    });
  },
};

// ═══════════════════════════════════════════════════
// 6. AUTO-BOOT
// ═══════════════════════════════════════════════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SidebarComponent.init());
} else {
  SidebarComponent.init();
}
