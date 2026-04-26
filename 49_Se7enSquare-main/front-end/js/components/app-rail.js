/**
 * Gameunity — App Rail + Sub-Sidebar Controller
 * M2 FIX: Merged sidebar.js into this file. One source of truth for all sidebar state.
 *
 * Handles:
 *  - App Rail expand/collapse (icon bar on far left)
 *  - Sub-Sidebar expand/collapse (page-level nav panel)
 *  - Section accordion toggling
 *  - localStorage persistence for all states
 *  - Shared tooltip rendering for collapsed states
 */
(function () {
    // ─── APP RAIL ────────────────────────────────────────────────────────────────
    var RAIL_LS_KEY = 'app_rail_expanded';
    var SUB_LS_KEY  = 'subSidebarCollapsed';

    function getAppRail() {
        return document.querySelector('.app-rail#sidebar') || document.querySelector('.app-rail');
    }

    function ensureRailToggle(rail) {
        var existing = rail.querySelector('.rail-toggle');
        if (existing) {
            if (existing.tagName !== 'BUTTON') {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = existing.className;
                btn.setAttribute('aria-label', 'Toggle navigation');
                btn.innerHTML = '<span class="rail-toggle-icon" aria-hidden="true">⟩</span>';
                existing.replaceWith(btn);
                return btn;
            }
            if (!existing.querySelector('.rail-toggle-icon')) {
                existing.innerHTML = '<span class="rail-toggle-icon" aria-hidden="true">⟩</span>';
            }
            return existing;
        }
        var logo = rail.querySelector('.rail-logo');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rail-toggle';
        btn.setAttribute('aria-label', 'Toggle navigation');
        btn.innerHTML = '<span class="rail-toggle-icon" aria-hidden="true">⟩</span>';
        if (logo) logo.insertAdjacentElement('afterend', btn);
        else rail.prepend(btn);
        return btn;
    }

    function publishRailWidth(rail) {
        try {
            document.documentElement.style.setProperty('--app-rail-w', rail.offsetWidth + 'px');
        } catch (e) { /* ignore */ }
    }

    function syncRailState(rail) {
        if (!rail) return;
        var expanded = rail.classList.contains('expanded');
        try { localStorage.setItem(RAIL_LS_KEY, expanded ? '1' : '0'); } catch (e) {}
        publishRailWidth(rail);
        var t = rail.querySelector('.rail-toggle');
        if (t) {
            t.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            t.title = expanded ? 'Collapse sidebar' : 'Expand sidebar';
        }
    }

    function initAppRail() {
        var rail = getAppRail();
        if (!rail) return;

        ensureRailToggle(rail);

        var wantExpanded = false;
        try { wantExpanded = localStorage.getItem(RAIL_LS_KEY) === '1'; } catch (e) {}
        rail.classList.toggle('expanded', wantExpanded);
        syncRailState(rail);

        var toggle = rail.querySelector('.rail-toggle');
        if (toggle && !toggle.dataset.railBound) {
            toggle.dataset.railBound = '1';
            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.toggleAppRail();
            });
        }

        var main = document.querySelector('.main');
        if (main && !main.dataset.railOutClose) {
            main.dataset.railOutClose = '1';
            main.addEventListener('click', function () {
                if (rail.classList.contains('expanded')) {
                    rail.classList.remove('expanded');
                    syncRailState(rail);
                }
            });
        }

        window.addEventListener('resize', function () { publishRailWidth(rail); });
    }

    window.toggleAppRail = function () {
        var rail = getAppRail();
        if (!rail) return;
        rail.classList.toggle('expanded');
        syncRailState(rail);
    };
    window.toggleSidebar = window.toggleAppRail; // backward-compat alias

    // ─── SUB-SIDEBAR ─────────────────────────────────────────────────────────────
    // M2 FIX: This logic was previously in sidebar.js — now lives here.

    function initSubSidebar() {
        // Support multiple possible sub-sidebar IDs across pages
        var sidebar = document.getElementById('subSidebar')
                   || document.getElementById('modSidebar')
                   || document.getElementById('adminSubSidebar')
                   || document.querySelector('.sub-sidebar');
        if (!sidebar) return;

        var isCollapsed = false;
        try { isCollapsed = localStorage.getItem(SUB_LS_KEY) === 'true'; } catch (e) {}
        if (isCollapsed) sidebar.classList.add('collapsed');
    }

    /** Global toggle — works for any page's sub-sidebar */
    window.toggleSubSidebar = function () {
        var sidebar = document.getElementById('subSidebar')
                   || document.getElementById('modSidebar')
                   || document.getElementById('adminSubSidebar')
                   || document.querySelector('.sub-sidebar');
        if (!sidebar) return;
        var isCollapsed = sidebar.classList.toggle('collapsed');
        try { localStorage.setItem(SUB_LS_KEY, isCollapsed); } catch (e) {}

        // Flip the toggle-icon glyph
        var icon = sidebar.querySelector('.toggle-icon');
        if (icon) icon.textContent = isCollapsed ? '›' : '‹';
    };

    /** Page-specific alias used in mod-panel.html */
    window.toggleModSidebar = window.toggleSubSidebar;

    // ─── SECTION ACCORDION ───────────────────────────────────────────────────────
    window.toggleSection = function (sectionId) {
        var section = document.getElementById(sectionId);
        var chevron = document.getElementById('chev-' + sectionId);
        if (section) {
            section.classList.toggle('collapsed');
            if (chevron) {
                chevron.style.transform = section.classList.contains('collapsed')
                    ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        }
    };

    // ─── TOOLTIPS ────────────────────────────────────────────────────────────────
    function initTooltips() {
        var tooltipEl = document.getElementById('sb-tooltip');
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'sb-tooltip';
            tooltipEl.className = 'sb-tooltip';
            document.body.appendChild(tooltipEl);
        }

        var elements = document.querySelectorAll('.rail-item, .rail-avatar, .nav-item');

        elements.forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                var text = el.getAttribute('data-tooltip');

                var inSubSidebar = el.closest('.sub-sidebar');
                if (inSubSidebar) {
                    var sidebar = inSubSidebar;
                    if (!sidebar.classList.contains('collapsed')) return;
                    if (!text) {
                        var textNode = el.querySelector('.nav-item-text');
                        if (textNode) text = textNode.textContent.trim();
                    }
                }

                if (!text) return;

                tooltipEl.textContent = text;
                tooltipEl.classList.add('visible');

                var rect = el.getBoundingClientRect();
                tooltipEl.style.top = (rect.top + (rect.height / 2) - (tooltipEl.offsetHeight / 2)) + 'px';
                tooltipEl.style.left = (rect.right + (inSubSidebar ? 12 : 16)) + 'px';
            });

            el.addEventListener('mouseleave', function () {
                tooltipEl.classList.remove('visible');
            });
        });
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        initAppRail();
        initSubSidebar();
        initTooltips();
    });
})();
