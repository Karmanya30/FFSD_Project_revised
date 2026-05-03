import { AppRole } from '../../modules/rbac/role.enum';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'escalated';

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: AppRole;
  bio?: string;
}

export interface CommunityRecord {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  tags: string[];
  // enriched fields for frontend display
  icon?: string;
  category?: string;
  slug?: string;
  memberCount?: number;
  onlineCount?: number;
}

export interface MembershipRecord {
  id: number;
  userId: number;
  communityId: number;
  joinedAt: string;
}

export interface EventRecord {
  id: number;
  title: string;
  description: string;
  communityId: number;
  date: string;
  // enriched fields for frontend display
  time?: string;
  type?: string;
  attendees?: number;
  maxAttendees?: number;
  status?: string;
  createdBy?: string;
}

export interface PostRecord {
  id: number;
  title: string;
  content: string;
  communityId: number;
  authorId: number;
  upvotes?: number;
  commentCount?: number;
  createdAt?: string;
}

export interface ReportRecord {
  id: number;
  reporterId: number;
  targetType: 'post' | 'user' | 'community';
  targetId: number;
  reason: string;
  status: ReportStatus;
  escalatedTo?: string;
}

const counters = {
  user: 5,
  community: 3,
  membership: 5,
  event: 4,
  post: 4,
  report: 4,
};

export const db = {
  users: [
    { id: 1, username: 'admin01', email: 'admin@gameunity.local', role: AppRole.ADMIN, bio: 'Platform administrator' },
    { id: 2, username: 'mod01', email: 'mod@gameunity.local', role: AppRole.MODERATOR, bio: 'Community moderator' },
    { id: 3, username: 'cm01', email: 'cm@gameunity.local', role: AppRole.COMMUNITY_MANAGER, bio: 'Community event manager' },
    { id: 4, username: 'player01', email: 'player@gameunity.local', role: AppRole.USER, bio: 'Loves FPS and RPG games' },
  ] as UserRecord[],
  communities: [
    {
      id: 1,
      name: 'FPS Arena',
      description: 'Competitive FPS players and tournaments',
      ownerId: 4,
      tags: ['fps', 'esports'],
      icon: '⚡',
      category: 'Gaming',
      slug: 'fps-arena',
      memberCount: 12400,
      onlineCount: 842,
    },
    {
      id: 2,
      name: 'Indie Dev Hub',
      description: 'A space for indie game creators',
      ownerId: 2,
      tags: ['indie', 'dev'],
      icon: '🎮',
      category: 'Gaming',
      slug: 'indie-dev-hub',
      memberCount: 15300,
      onlineCount: 1205,
    },
  ] as CommunityRecord[],
  memberships: [
    { id: 1, userId: 2, communityId: 1, joinedAt: '2026-01-10T09:00:00.000Z' },
    { id: 2, userId: 4, communityId: 1, joinedAt: '2026-01-15T11:30:00.000Z' },
    { id: 3, userId: 3, communityId: 2, joinedAt: '2026-02-01T08:00:00.000Z' },
    { id: 4, userId: 1, communityId: 2, joinedAt: '2026-02-05T10:00:00.000Z' },
  ] as MembershipRecord[],
  events: [
    {
      id: 1,
      title: 'Friday Scrim Night',
      description: 'Weekly custom matches',
      communityId: 1,
      date: '2026-05-09',
      time: '6:00 PM',
      type: 'tournament',
      attendees: 48,
      maxAttendees: 100,
      status: 'approved',
      createdBy: 'admin01',
    },
    {
      id: 2,
      title: 'Pixel Jam',
      description: '48-hour game jam kickoff',
      communityId: 2,
      date: '2026-05-10',
      time: '9:00 AM',
      type: 'hackathon',
      attendees: 120,
      maxAttendees: 200,
      status: 'approved',
      createdBy: 'cm01',
    },
    {
      id: 3,
      title: 'UI Design Workshop',
      description: 'Learn UI design fundamentals for games',
      communityId: 2,
      date: '2026-05-15',
      time: '5:00 PM',
      type: 'workshop',
      attendees: 35,
      maxAttendees: 50,
      status: 'pending',
      createdBy: 'player01',
    },
  ] as EventRecord[],
  posts: [
    {
      id: 1,
      title: 'Looking for squad',
      content: 'Need two players for ranked grind',
      communityId: 1,
      authorId: 4,
      upvotes: 14,
      commentCount: 5,
      createdAt: '2026-04-28T10:00:00.000Z',
    },
    {
      id: 2,
      title: 'Show your prototype',
      content: 'Drop your latest indie demos in comments',
      communityId: 2,
      authorId: 2,
      upvotes: 28,
      commentCount: 12,
      createdAt: '2026-04-29T15:00:00.000Z',
    },
    {
      id: 3,
      title: 'Tournament rules update',
      content: 'Check the pinned post for updated ruleset',
      communityId: 1,
      authorId: 1,
      upvotes: 42,
      commentCount: 8,
      createdAt: '2026-04-30T09:00:00.000Z',
    },
  ] as PostRecord[],
  reports: [
    {
      id: 1,
      reporterId: 4,
      targetType: 'post',
      targetId: 1,
      reason: 'Potential abusive language in replies',
      status: 'pending',
    },
    {
      id: 2,
      reporterId: 2,
      targetType: 'user',
      targetId: 4,
      reason: 'Spam-like behavior',
      status: 'reviewed',
    },
    {
      id: 3,
      reporterId: 1,
      targetType: 'community',
      targetId: 2,
      reason: 'Misleading community description',
      status: 'pending',
    },
  ] as ReportRecord[],
};

export function nextId(entity: keyof typeof counters): number {
  const value = counters[entity];
  counters[entity] += 1;
  return value;
}

