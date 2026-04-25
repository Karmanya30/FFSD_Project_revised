/**
 * Gameunity — Global Utility Module
 * Handles date formatting, DOM security, and temporary UI notifications.
 */

// ==========================================
// 1. TIME & DATE FORMATTING
// ==========================================

/**
 * Formats a date for event displays.
 * @example '2026-04-15' -> 'April 15, 2026'
 */
export function formatEventDate(dateString) {
    if (!dateString) return "Date TBD";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

/**
 * Gets a timestamp for chat messages.
 * @example '18:30'
 */
export function getCurrentShortTime() {
    return new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
}

/**
 * Converts a timestamp into a relative string.
 * @example 1711732800000 -> '5m ago'
 */
export function formatRelativeTime(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return then.toLocaleDateString();
}

// ==========================================
// 2. SECURITY (XSS PREVENTION)
// ==========================================

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS).
 * CRITICAL: Use this for all user-generated content in chat.
 */
export function escapeHTML(str) {
    if (!str) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
}

// ==========================================
// 3. UI HELPERS (TOAST SYSTEM)
// ==========================================

/**
 * Global Toast System
 * @param {string} message 
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 */
export function showToast(message, type = 'info') {
    let container = document.getElementById('nexus-toast-container');
    
    // Create container if missing
    if (!container) {
        container = document.createElement('div');
        container.id = 'nexus-toast-container';
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'column-reverse', // Newest at bottom
            gap: '12px',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `nexus-toast nexus-toast-${type}`;
    
    // Icon Mapping
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#5B6EF5' };

    toast.innerHTML = `
        <span style="margin-right: 10px;">${icons[type] || '🔔'}</span>
        <span>${message}</span>
    `;

    Object.assign(toast.style, {
        background: 'linear-gradient(180deg, rgba(19, 24, 42, 0.96), rgba(11, 14, 26, 0.92))',
        color: '#fff',
        padding: '12px 18px',
        borderRadius: '14px',
        boxShadow: '0 18px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: `4px solid ${colors[type] || '#fff'}`,
        backdropFilter: 'blur(16px)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '280px',
        maxWidth: '400px',
        opacity: '0',
        transform: 'translateX(20px) translateY(4px)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center'
    });

    container.appendChild(toast);

    // Trigger Entry Animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Auto-remove sequence
    const delay = 4000;
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 400);
    }, delay);
}

// Attach to window for easy access in non-module scripts if needed
window.toast = showToast;