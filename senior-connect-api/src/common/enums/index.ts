export enum UserRole {
  User = 'User',
  Admin = 'Admin',
}

export enum UserStatus {
  Pending = 'Pending',
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  Blocked = 'Blocked',
}

export enum ActivityStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}

export enum CategoryStatus {
  Active = 'Active',
  Disabled = 'Disabled',
}

export enum Difficulty {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export enum OtpType {
  VerifyEmail = 'VerifyEmail',
  ResetPassword = 'ResetPassword',
}

export enum ParticipantStatus {
  Joined = 'Joined',
  Cancelled = 'Cancelled',
}

export enum NotificationAudience {
  Everyone = 'Everyone',
  Seniors = 'Seniors',
  Volunteers = 'Volunteers',
}

export enum NotificationStatus {
  Delivered = 'Delivered',
  Failed = 'Failed',
}

export enum ActivityTab {
  All = 'All',
  Upcoming = 'Upcoming',
  Past = 'Past',
}
