export const PARTICIPANTS_ROUTES = {
  ROOT: 'participants',
  JOIN: 'activities/:activityId/join',
  LEAVE: 'activities/:activityId/leave',
  LIST: 'activities/:activityId/participants',
} as const;
