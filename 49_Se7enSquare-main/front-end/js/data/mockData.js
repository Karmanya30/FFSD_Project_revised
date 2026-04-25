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

function getDefaultData() {
    return {
        // ── USERS ──
        users: [
            { id: 'u1', name: 'Alex Morgan', handle: 'alexmorgan', email: 'alex@email.com', avatar: 'AM', bg: 'linear-gradient(135deg,#5B6EF5,#8B5CF6)', role: 'gamer', status: 'active', joined: 'Jan 12, 2023', communities: 6, warnings: 0, bans: 0, violations: 0 },
            { id: 'u2', name: 'Jake Kim', handle: 'jakekim', email: 'jake@email.com', avatar: 'JK', bg: 'linear-gradient(135deg,#34D399,#059669)', role: 'gamer', status: 'active', joined: 'Feb 3, 2023', communities: 4, warnings: 0, bans: 0, violations: 0 },
            { id: 'u3', name: 'Sara Lee', handle: 'saralee', email: 'sara@email.com', avatar: 'SL', bg: 'linear-gradient(135deg,#F59E0B,#f97316)', role: 'mod', status: 'active', joined: 'Mar 8, 2023', communities: 8, warnings: 0, bans: 0, violations: 0 },
            { id: 'u4', name: 'Mia Park', handle: 'miapark', email: 'mia@email.com', avatar: 'MP', bg: 'linear-gradient(135deg,#F472B6,#EC4899)', role: 'gamer', status: 'active', joined: 'Apr 1, 2023', communities: 3, warnings: 0, bans: 0, violations: 0 },
            { id: 'u5', name: 'DarkRaider99', handle: 'darkraider99', email: 'dark@anon.com', avatar: 'DR', bg: 'linear-gradient(135deg,#F87171,#dc2626)', role: 'gamer', status: 'banned', joined: 'Aug 14, 2023', communities: 1, warnings: 3, bans: 1, violations: 5 },
            { id: 'u6', name: 'FloodBot99', handle: 'floodbot99', email: 'bot@spam.io', avatar: 'FB', bg: 'linear-gradient(135deg,#6B7280,#374151)', role: 'gamer', status: 'banned', joined: 'Dec 1, 2023', communities: 12, warnings: 2, bans: 1, violations: 4 },
            { id: 'u7', name: 'rustwasm_dev', handle: 'rustwasm_dev', email: 'rw@dev.io', avatar: 'RW', bg: 'linear-gradient(135deg,#06B6D4,#0EA5E9)', role: 'gamer', status: 'active', joined: 'Jan 2, 2024', communities: 2, warnings: 0, bans: 0, violations: 0 },
            { id: 'u8', name: 'PromoKing', handle: 'promoking', email: 'promo@ads.com', avatar: 'PK', bg: 'linear-gradient(135deg,#A78BFA,#7C3AED)', role: 'gamer', status: 'warned', joined: 'Jan 9, 2024', communities: 7, warnings: 1, bans: 0, violations: 2 },
            { id: 'u9', name: 'Super Admin', handle: 'superadmin', email: 'admin@nexushub.io', avatar: 'SA', bg: 'linear-gradient(135deg,#5B6EF5,#3B82F6)', role: 'superuser', status: 'active', joined: 'Jan 1, 2023', communities: 0, warnings: 0, bans: 0, violations: 0 },
            { id: 'u10', name: 'Admin User', handle: 'admin', email: 'admin@platform.io', avatar: 'AU', bg: 'linear-gradient(135deg,#F59E0B,#EF4444)', role: 'admin', status: 'active', joined: 'Jan 1, 2023', communities: 0, warnings: 0, bans: 0, violations: 0 },
        ],

        // ── COMMUNITIES ──
        communities: [
            { id: 'c1', name: 'Pro Gamers', slug: 'dev-nexus', icon: '⚡', description: 'Realtime discussions on Console and open source', category: 'Gaming', members: 12400, privacy: 'public', status: 'active', createdBy: 'u1', createdAt: '2023-01-15' },
            { id: 'c2', name: 'Indie Games', slug: 'design-studio', icon: '🎨', description: 'Weekly UI crits and design sprints', category: 'Design', members: 8200, privacy: 'public', status: 'active', createdBy: 'u3', createdAt: '2023-02-20' },
            { id: 'c3', name: 'Modding Community', slug: 'open-source-hub', icon: '🌱', description: 'Collaborate on open source projects', category: 'Gaming', members: 6800, privacy: 'public', status: 'active', createdBy: 'u2', createdAt: '2023-03-10' },
            { id: 'c4', name: 'Tournament Hub', slug: 'hackathon-hq', icon: '🏆', description: 'Host and participate in hackathons', category: 'Events', members: 5100, privacy: 'public', status: 'active', createdBy: 'u1', createdAt: '2023-04-05' },
            { id: 'c5', name: 'GameZone', slug: 'gamezone', icon: '🎮', description: 'Gaming discussions, esports, and tournaments', category: 'Gaming', members: 15300, privacy: 'public', status: 'active', createdBy: 'u4', createdAt: '2023-05-12' },
            { id: 'c6', name: 'FPS Masters', slug: 'FPS Masters', icon: '🌿', description: 'Sustainable tech and green coding practices', category: 'Education', members: 3200, privacy: 'public', status: 'active', createdBy: 'u7', createdAt: '2023-06-01' },
        ],

        // ── CHANNELS ──
        channels: [
            { id: 'ch1', communityId: 'c1', name: 'general', type: 'text', description: 'General discussion' },
            { id: 'ch2', communityId: 'c1', name: 'frontend', type: 'text', description: 'frontend development' },
            { id: 'ch3', communityId: 'c1', name: 'code-review', type: 'text', description: 'Submit code for review' },
            { id: 'ch4', communityId: 'c1', name: 'announcements', type: 'text', description: 'Official announcements' },
            { id: 'ch5', communityId: 'c2', name: 'general', type: 'text', description: 'General design discussion' },
            { id: 'ch6', communityId: 'c2', name: 'ui-crits', type: 'text', description: 'Weekly UI critiques' },
            { id: 'ch7', communityId: 'c5', name: 'general', type: 'text', description: 'General gaming talk' },
            { id: 'ch8', communityId: 'c5', name: 'off-topic', type: 'text', description: 'Off-topic discussions' },
        ],

        // ── EVENTS ──
        events: [
            { id: 'e1', title: 'frontend Hackathon 2026', communityId: 'c1', date: '2026-04-15', time: '10:00 AM', description: 'Build something amazing in 48 hours', type: 'hackathon', attendees: 234, maxAttendees: 500, status: 'upcoming', createdBy: 'u1' },
            { id: 'e2', title: 'Design Systems Workshop', communityId: 'c2', date: '2026-04-08', time: '2:00 PM', description: 'Learn to build scalable design systems', type: 'workshop', attendees: 89, maxAttendees: 150, status: 'upcoming', createdBy: 'u3' },
            { id: 'e3', title: 'Open Source Friday', communityId: 'c3', date: '2026-04-04', time: '6:00 PM', description: 'Contribute to open source projects together', type: 'meetup', attendees: 56, maxAttendees: 100, status: 'upcoming', createdBy: 'u2' },
            { id: 'e4', title: 'Esports Tournament', communityId: 'c5', date: '2026-04-20', time: '4:00 PM', description: 'Competitive gaming tournament with prizes', type: 'tournament', attendees: 412, maxAttendees: 1000, status: 'upcoming', createdBy: 'u4' },
            { id: 'e5', title: 'FPS Conf Watchparty', communityId: 'c1', date: '2026-03-25', time: '9:00 AM', description: 'Watch FPS Conf together and discuss new features', type: 'watchparty', attendees: 120, maxAttendees: 200, status: 'completed', createdBy: 'u1' },
        ],

        // ── REPORTS ──
        reports: [
            { id: 'r1', reportId: '#4821', userId: 'u5', reportedBy: 'anonymous', channelId: 'ch1', reason: 'Hate Speech / Harassment', reasonIcon: '🚫', detail: 'Content that promotes hatred or discriminates based on individual characteristics.', status: 'pending', createdAt: '2026-03-30T10:28:00', repeat: '3× offender' },
            { id: 'r2', reportId: '#4820', userId: 'u6', reportedBy: 'system', channelId: 'ch2', reason: 'Spam / Self-promotion', reasonIcon: '📢', detail: 'Flooding the channel with promotional content.', status: 'pending', createdAt: '2026-03-30T10:14:00', repeat: null },
            { id: 'r3', reportId: '#4819', userId: 'u8', reportedBy: 'u1', channelId: 'ch3', reason: 'Harassment', reasonIcon: '😡', detail: 'Aggressive replies targeting new members.', status: 'review', createdAt: '2026-03-30T09:47:00', repeat: '2× offender' },
            { id: 'r4', reportId: '#4818', userId: 'u7', reportedBy: 'u3', channelId: 'ch1', reason: 'Misinformation', reasonIcon: '❌', detail: 'Sharing unverified technical information.', status: 'pending', createdAt: '2026-03-30T09:00:00', repeat: null },
            { id: 'r5', reportId: '#4817', userId: 'u5', reportedBy: 'u2', channelId: 'ch8', reason: 'NSFW Content', reasonIcon: '🔞', detail: 'Posting inappropriate content.', status: 'escalated', createdAt: '2026-03-30T08:00:00', repeat: '5× offender' },
        ],

        // ── APPEALS ──
        appeals: [
            { id: 'a1', userId: 'u5', actionId: 'ACT-001', reason: 'I believe the ban was unjustified. The message was taken out of context.', acknowledgement: 'partial', resolution: 'Reduce Sanction', status: 'pending', createdAt: '2026-03-28T14:00:00' },
        ],

        // ── MESSAGES (Chat) ──
        messages: [
            { id: 'm1', channelId: 'ch1', userId: 'u9', sender: 'System Bot', message: 'Welcome to the Pro Gamers channel! 👋', role: 'bot', timestamp: '2026-03-30T10:00:00' },
            { id: 'm2', channelId: 'ch1', userId: 'u1', sender: 'Alex Morgan', message: 'Anyone up for a raid in the #gaming channel later?', role: 'member', timestamp: '2026-03-30T10:05:00' },
            { id: 'm3', channelId: 'ch1', userId: 'u3', sender: 'Sara Lee', message: 'Check out the new #announcements for the hackathon rules.', role: 'mod', timestamp: '2026-03-30T10:12:00' },
            { id: 'm4', channelId: 'ch1', userId: 'u2', sender: 'Jake Kim', message: 'Just pushed a PR — can someone review it? 🔥', role: 'member', timestamp: '2026-03-30T10:15:00' },
        ],

        // ── AUDIT LOG ──
        auditLog: [
            { id: 'al1', action: 'Warning Issued', target: 'DarkRaider99', moderator: 'Sara Lee', reason: 'Off-topic spam', timestamp: '2026-02-18T14:00:00', community: 'Pro Gamers' },
            { id: 'al2', action: 'Warning Issued', target: 'DarkRaider99', moderator: 'Sara Lee', reason: 'Aggressive reply', timestamp: '2026-02-27T11:00:00', community: 'Pro Gamers' },
            { id: 'al3', action: 'User Muted', target: 'DarkRaider99', moderator: 'Sara Lee', reason: '1-hour mute alongside 2nd warning', timestamp: '2026-02-27T11:05:00', community: 'Pro Gamers' },
            { id: 'al4', action: 'Community Created', target: 'FPS Masters', moderator: 'System', reason: 'New community registered', timestamp: '2026-03-01T09:00:00', community: 'FPS Masters' },
            { id: 'al5', action: 'User Banned', target: 'FloodBot99', moderator: 'Admin', reason: 'Persistent spam violations', timestamp: '2026-03-15T16:00:00', community: 'Pro Gamers' },
        ],

        // ── NOTIFICATIONS ──
        notifications: [
            { id: 'n1', type: 'mention', from: 'Jake Kim', text: 'mentioned you in #general', time: '2m ago', unread: true },
            { id: 'n2', type: 'reaction', from: 'Sara Lee', text: 'reacted ❤️ to your message', time: '15m ago', unread: true },
            { id: 'n3', type: 'event', from: 'System', text: 'frontend Hackathon starts in 2 weeks', time: '1h ago', unread: false },
        ],

        // ── PLATFORM CONFIG (Super User only) ──
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
    if (!existing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultData()));
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
