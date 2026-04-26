/**
 * DEPRECATED/TODO - api.js
 * AUDIT FIX: This file is currently orphaned and not imported by any HTML page.
 * Keep for reference if backend integration is planned, otherwise safe to delete.
 */
/**
 * Gameunity — Core API Wrapper
 * Centralizes all network requests and handles mock data for the frontend prototype.
 */

const API_BASE = 'http://localhost:3000/api';

// ==========================================
// 1. MOCK DATA STORE
// ==========================================
// Centralized mock data to keep the fetch logic clean
const MOCK_DATA = {
    '/chat/history': [
        { sender: "System Bot", message: "Welcome to the Pro Gamers channel! 👋", role: "bot", timestamp: "10:00 AM" },
        { sender: "ProGamer99", message: "Anyone up for a raid in the #gaming channel later?", role: "member", timestamp: "10:05 AM" },
        { sender: "Sara Lee", message: "Check out the new #announcements for the hackathon rules.", role: "mod", timestamp: "10:12 AM" }
    ],
    '/moderation/reports': [
        { id: 1, user: "ToxicPlayer", reason: "Harassment", reportedBy: "User_88", status: "Pending", time: "5m ago" },
        { id: 2, user: "SpamBot", reason: "Phishing links", reportedBy: "System", status: "Flagged", time: "12m ago" },
        { id: 3, user: "Troll_X", reason: "Hate Speech", reportedBy: "Alex Morgan", status: "In Review", time: "1h ago" }
    ],
    '/user/notifications': [
        { id: 101, type: 'mention', from: 'Jake Kim', text: 'mentioned you in #general', time: '2m ago', unread: true },
        { id: 102, type: 'reaction', from: 'Sara Lee', text: 'reacted ❤️ to your message', time: '15m ago', unread: true }
    ]
};

// ==========================================
// 2. CORE FETCH WRAPPER
// ==========================================

/**
 * Generic Fetch utility with built-in mock support and error handling
 * @param {string} endpoint - The API path (e.g., '/chat/history')
 * @param {Object} options - Standard fetch options (method, headers, body)
 * @returns {Promise<Object>}
 */
export async function fetchData(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    try {
        // --- LOGGING ---
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`%c[API ${options.method || 'GET'}] %c${endpoint}`, "color: #5B6EF5; font-weight: bold;", "color: #aaa;");
        }

        // --- AUTH INTERCEPTOR ---
        // Automatically inject the token if the user is logged in
        const user = JSON.parse(localStorage.getItem('nexus_user'));
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (user?.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }

        // --- MOCK LOGIC (For frontend Prototype) ---
        // Remove this block once the Strategy is fully integrated
        if (MOCK_DATA[endpoint]) {
            // Simulate 300ms network latency
            await new Promise(resolve => setTimeout(resolve, 300));
            return { 
                success: true, 
                data: MOCK_DATA[endpoint],
                source: 'mock' 
            };
        }

        // --- REAL FETCH (Disabled for prototype) ---
        /*
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        return await response.json();
        */

        // Fallback for non-mocked endpoints in prototype
        return { success: true, message: "Endpoint hit (Prototype Mode)", data: {} };

    } catch (error) {
        console.error(`%c[API ERROR] %cFailed to fetch ${endpoint}:`, "color: #ef4444; font-weight: bold;", "color: #fff;", error);
        
        if (window.toast) {
            window.toast("⚠️ Connection error. Please try again.");
        }
        
        return { success: false, error: error.message };
    }
}

// ==========================================
// 3. CONVENIENCE METHODS
// ==========================================

export const api = {
    get: (endpoint) => fetchData(endpoint, { method: 'GET' }),
    post: (endpoint, body) => fetchData(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => fetchData(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => fetchData(endpoint, { method: 'DELETE' })
};
