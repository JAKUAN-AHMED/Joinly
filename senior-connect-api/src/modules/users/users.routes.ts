export const USERS_ROUTES = {
  ROOT: 'users',
  ME: 'me',
  ME_LOCATION: 'me/location',
  ME_INTERESTS: 'me/interests',
  ME_PROFILE_PHOTO: 'me/profile-photo',
  ME_APP_PREFERENCES: 'me/app-preferences',
  ME_BLOCKED_USERS: 'me/blocked-users',
  BLOCK_USER: ':userId/block',
  ADMIN_USERS: 'admin/users',
  ADMIN_USER_DETAILS: 'admin/users/:userId',
  ADMIN_USER_STATUS: 'admin/users/:userId/status',
} as const;
