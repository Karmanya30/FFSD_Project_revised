import { AppRole } from '../../modules/rbac/role.enum';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

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
}

export interface MembershipRecord {
  id: number;
  userId: number;
  communityId: number;
}

export interface EventRecord {
  id: number;
  title: string;
  description: string;
  communityId: number;
  date: string;
}

export interface PostRecord {
  id: number;
  title: string;
  content: string;
  communityId: number;
  authorId: number;
}

export interface ReportRecord {
  id: number;
  reporterId: number;
  targetType: 'post' | 'user' | 'community';
  targetId: number;
  reason: string;
  status: ReportStatus;
}

const counters = {
  user: 4,
  community: 3,
  membership: 4,
  event: 3,
  post: 3,
  report: 3,
};

export const db = {
  users: [
    { id: 1, username: 'admin01', email: 'admin@gameunity.local', role: AppRole.ADMIN },
    { id: 2, username: 'mod01', email: 'mod@gameunity.local', role: AppRole.MODERATOR },
    { id: 3, username: 'player01', email: 'player@gameunity.local', role: AppRole.USER },
  ] as UserRecord[],
  communities: [
    {
      id: 1,
      name: 'FPS Arena',
      description: 'Competitive FPS players and tournaments',
      ownerId: 3,
      tags: ['fps', 'esports'],
    },
    {
      id: 2,
      name: 'Indie Dev Hub',
      description: 'A space for indie game creators',
      ownerId: 2,
      tags: ['indie', 'dev'],
    },
  ] as CommunityRecord[],
  memberships: [
    { id: 1, userId: 2, communityId: 1 },
    { id: 2, userId: 3, communityId: 1 },
    { id: 3, userId: 3, communityId: 2 },
  ] as MembershipRecord[],
  events: [
    {
      id: 1,
      title: 'Friday Scrim Night',
      description: 'Weekly custom matches',
      communityId: 1,
      date: '2026-05-02T18:00:00.000Z',
    },
    {
      id: 2,
      title: 'Pixel Jam',
      description: '48-hour game jam kickoff',
      communityId: 2,
      date: '2026-05-10T09:00:00.000Z',
    },
  ] as EventRecord[],
  posts: [
    {
      id: 1,
      title: 'Looking for squad',
      content: 'Need two players for ranked grind',
      communityId: 1,
      authorId: 3,
    },
    {
      id: 2,
      title: 'Show your prototype',
      content: 'Drop your latest indie demos in comments',
      communityId: 2,
      authorId: 2,
    },
  ] as PostRecord[],
  reports: [
    {
      id: 1,
      reporterId: 3,
      targetType: 'post',
      targetId: 1,
      reason: 'Potential abusive language in replies',
      status: 'pending',
    },
    {
      id: 2,
      reporterId: 2,
      targetType: 'user',
      targetId: 3,
      reason: 'Spam-like behavior',
      status: 'reviewed',
    },
  ] as ReportRecord[],
};

export function nextId(entity: keyof typeof counters): number {
  const value = counters[entity];
  counters[entity] += 1;
  return value;
}
