export enum AppRole {
  ADMIN = 'admin',
  COMMUNITY_MANAGER = 'community_manager',
  MODERATOR = 'moderator',
  USER = 'user',
  GAMER = 'gamer', // alias accepted from frontend sessions
}

export const ALL_ROLES: string[] = ['admin', 'community_manager', 'moderator', 'user', 'gamer'];
