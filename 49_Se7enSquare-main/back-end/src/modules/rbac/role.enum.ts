export enum AppRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

export const ALL_ROLES: AppRole[] = [AppRole.ADMIN, AppRole.MODERATOR, AppRole.USER];
