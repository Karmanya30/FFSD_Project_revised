/**
 * Gameunity — Centralized Mock Data Store
 * Single source of truth for all frontend prototype data.
 * All CRUD operations read/write to this store via crudService.js.
 * Data persists across page loads using localStorage.
 */

// ==========================================
// 1. STORAGE KEY & INITIALIZATION
// ==========================================
const STORAGE_KEY = 'nexus_data_store';
const DATA_VERSION = '1.2'; // Increment to force reset legacy data

function getDefaultData() {
    return {
        // ── USERS ──
        users: [
            { id: 'u1', name: 'Rahul Kumar', handle: 'rahulk', email: 'rahul@email.com', avatar: 'RK', bg: 'linear-gradient(135deg,#5B6EF5,#8B5CF6)', role: 'admin', status: 'active', joined: 'Jan 12, 2023', communities: 2, warnings: 0, bans: 0, violations: 0 },
            { id: 'u2', name: 'Arjun Kumar', handle: 'arjunk', email: 'arjun@email.com', avatar: 'AK', bg: 'linear-gradient(135deg,#34D399,#059669)', role: 'gamer', status: 'active', joined: 'Feb 3, 2023', communities: 2, warnings: 0, bans: 0, violations: 0 }
        ],

        // ── COMMUNITIES ──
        communities: [
            { id: 'c1', name: 'Pro Gamers', slug: 'pro-gamers', icon: '⚡', description: 'Realtime discussions on Console and open source', category: 'Gaming', members: 12400, online: 842, privacy: 'public', status: 'active', createdBy: 'u1', createdAt: '2023-01-15', grad: 'grad-purple' },
            { id: 'c2', name: 'GameZone', slug: 'gamezone', icon: '🎮', description: 'Gaming discussions, esports, and tournaments', category: 'Gaming', members: 15300, online: 1205, privacy: 'public', status: 'active', createdBy: 'u2', createdAt: '2023-05-12', grad: 'grad-cyan' }
        ],

        // ── CHANNELS ──
        channels: [
            { id: 'ch1', communityId: 'c1', name: 'general', type: 'text', description: 'General discussion' },
            { id: 'ch2', communityId: 'c1', name: 'announcements', type: 'text', description: 'Official announcements' }
        ],

        events: [
            { id: 'e1', title: 'Gaming Hackathon', communityId: 'c1', date: '2026-03-07', time: '2:00 PM', description: 'Monthly hackathon for all developers.', type: 'hackathon', category: 'Hackathon', attendees: 248, maxAttendees: 500, status: 'upcoming', createdBy: 'u1' },
            { id: 'e2', title: 'UI Design Workshop', communityId: 'c2', date: '2026-03-10', time: '5:00 PM', description: 'Learn UI design for games.', type: 'workshop', category: 'Workshop', attendees: 120, maxAttendees: 150, status: 'upcoming', createdBy: 'u2' }
        ],

        // ── REPORTS ──
        reports: [
            { id: 'r1', reportId: '#4821', userId: 'u2', reportedBy: 'u1', channelId: 'ch1', reason: 'Spam', reasonIcon: '📢', detail: 'Flooding the channel with promotional content.', status: 'pending', createdAt: '2026-03-30T10:14:00', repeat: null },
            { id: 'r2', reportId: '#4820', userId: 'u1', reportedBy: 'u2', channelId: 'ch2', reason: 'Harassment', reasonIcon: '😡', detail: 'Aggressive replies targeting new members.', status: 'review', createdAt: '2026-03-30T09:47:00', repeat: '2× offender' }
        ],

        // ── APPEALS ──
        appeals: [
            { id: 'a1', userId: 'u2', actionId: 'ACT-001', reason: 'I believe the ban was unjustified. The message was taken out of context.', acknowledgement: 'partial', resolution: 'Reduce Sanction', status: 'pending', createdAt: '2026-03-28T14:00:00' }
        ],

        // ── MESSAGES (Chat) ──
        messages: [
            { id: 'm1', channelId: 'ch1', userId: 'u1', sender: 'Rahul Kumar', message: 'Welcome to the Pro Gamers channel! 👋', role: 'admin', timestamp: '2026-03-30T10:00:00' },
            { id: 'm2', channelId: 'ch1', userId: 'u2', sender: 'Arjun Kumar', message: 'Anyone up for a raid later?', role: 'gamer', timestamp: '2026-03-30T10:05:00' }
        ],

        // ── AUDIT LOG ──
        auditLog: [
            { id: 'al1', action: 'Warning Issued', target: 'Arjun Kumar', moderator: 'Rahul Kumar', reason: 'Off-topic spam', timestamp: '2026-02-18T14:00:00', community: 'Pro Gamers' },
            { id: 'al2', action: 'Community Created', target: 'GameZone', moderator: 'System', reason: 'New community registered', timestamp: '2026-03-01T09:00:00', community: 'GameZone' }
        ],

        // ── NOTIFICATIONS ──
        notifications: [
            { id: 'n1', type: 'mention', from: 'Rahul Kumar', text: 'mentioned you in #general', channel: 'general', time: '2m ago', unread: true },
            { id: 'n2', type: 'reaction', from: 'Arjun Kumar', text: 'reacted ❤️ to your message', channel: 'frontend', time: '15m ago', unread: true }
        ],

        // ── PLATFORM CONFIG (System Admin only) ──
        platformConfig: {
            autoModEnabled: true,
            autoModAccuracy: 97.3,
            maxCommunitiesPerUser: 10,
            maxChannelsPerCommunity: 50,
            allowPublicRegistration: true,
            moderationPolicies: [
                '3 warnings = automatic 7-day ban',
                'NSFW content = immediate escalation',
                'Spam accounts = permanent ban on confirmation'
            ]
        }
    };
}

// ==========================================
// 2. STORE INITIALIZATION
// ==========================================

function initStore() {
    const existing = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem('nexus_data_version');
    
    // Force reset if version mismatch or data missing
    if (!existing || version !== DATA_VERSION) {
        console.log('[MockData] Initializing/Updating store to version ' + DATA_VERSION);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultData()));
        localStorage.setItem('nexus_data_version', DATA_VERSION);
        
        // Also reset joined list for demo consistency
        localStorage.setItem('nexus_joined_communities', JSON.stringify(['pro-gamers', 'gamezone']));
    }
}

function getStore() {
    initStore();
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
        console.error('[MockData] Corrupted store, resetting...');
        const data = getDefaultData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
    }
}

function saveStore(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultData()));
    console.log('[MockData] Store reset to defaults.');
}

// ==========================================
// 3. PUBLIC API (Exported via window)
// ==========================================

window.NexusData = {
    getStore,
    saveStore,
    resetStore,
    getDefaultData,
    STORAGE_KEY
};

// Auto-init on load
initStore();
console.log('%c[Gameunity] %cMock data store initialized.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
