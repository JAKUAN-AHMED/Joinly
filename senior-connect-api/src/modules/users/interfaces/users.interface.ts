import { UserRole, UserStatus } from '../../../common/enums';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  language: string;
  profilePhoto: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  role: UserRole;
  status: UserStatus;
  dateFormat: string;
  notificationSounds: boolean;
  allowNotifications: boolean;
  isEmailVerified: boolean;
  memberSince: Date;
}

export interface MyProfileResponse extends UserProfile {
  activityJoined: number;
  activityCreated: number;
  connections: number;
  interests: { id: string; categoryName: string }[];
}

export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  email: string;
  country: string | null;
  activities: number;
  status: UserStatus;
  dateJoined: Date;
}

export interface AdminUserDetails extends MyProfileResponse {
  phoneNumber: string | null;
  activitiesJoined: number;
  activitiesCreated: number;
  joinedActivities: unknown[];
  createdActivities: unknown[];
}

export interface BlockedUserRow {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
}
