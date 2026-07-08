export const ACTIVITIES_ROUTES = {
  ROOT: 'activities',
  LIST: '',
  FEATURED: 'featured',
  MY_ACTIVITIES: 'my-activities',
  JOINED_ACTIVITIES: 'joined-activities',
  DETAILS: ':id',
  ADMIN_ACTIVITIES: 'admin/activities',
  ADMIN_ACTIVITY: 'admin/activities/:id',
  ADMIN_ACTIVITY_STATUS: 'admin/activities/:id/status',
} as const;
