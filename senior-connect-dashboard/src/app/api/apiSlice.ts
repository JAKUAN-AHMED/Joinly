/**
 * RTK Query API slice for the Senior Connect backend (NestJS).
 *
 * Endpoints mirror senior-connect-api exactly — same routes, same
 * Figma-derived field names, same `{ success, message, data, meta? }` envelope.
 * Types mirror the backend's *.interface.ts files 1:1.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import type { AuthUser } from '../authSlice';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export type UserStatus = 'Pending' | 'Active' | 'Inactive' | 'Suspended' | 'Blocked';
export type ActivityStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
export type CategoryStatus = 'Active' | 'Disabled';
export type NotificationStatus = 'Delivered' | 'Failed';
export type Audience = 'Everyone' | 'Seniors' | 'Volunteers';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface CategoryItem {
  id: string;
  categoryName: string;
  status: CategoryStatus;
}

export interface AdminCategoryRow extends CategoryItem {
  activityCount: number;
}

export interface AdminCategoryStats {
  totalCategories: number;
  activeNow: number;
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
  dateJoined: string;
}

export interface UserInterest {
  id: string;
  categoryName: string;
}

export interface UserActivityHistoryRow {
  id: string;
  activityName: string;
  categoryName: string;
  activityDate: string;
  status: ActivityStatus;
}

export interface AdminUserDetails {
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
  role: string;
  status: UserStatus;
  dateFormat: string;
  notificationSounds: boolean;
  allowNotifications: boolean;
  isEmailVerified: boolean;
  memberSince: string;
  activityJoined: number;
  activityCreated: number;
  connections: number;
  interests: UserInterest[];
  activitiesJoined: number;
  activitiesCreated: number;
  joinedActivities: UserActivityHistoryRow[];
  createdActivities: UserActivityHistoryRow[];
}

export interface ActivityOrganizerBrief {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
}

export interface ActivityCard {
  id: string;
  activityName: string;
  activityPhoto: string | null;
  categoryName: string;
  activityDate: string;
  activityTime: string;
  activityLocation: string;
  latitude: number | null;
  longitude: number | null;
  participants: string;
  joinedCount: number;
  maximumNumberOfParticipants: number;
  distanceKm: number | null;
  status: ActivityStatus;
  organizer: ActivityOrganizerBrief;
}

export interface ActivityDetails {
  id: string;
  activityName: string;
  activityPhoto: string | null;
  category: { id: string; categoryName: string };
  activityDate: string;
  activityTime: string;
  activityLocation: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  participants: string;
  joinedCount: number;
  maximumNumberOfParticipants: number;
  participantAvatars: (string | null)[];
  descriptions: string;
  difficulty: Difficulty;
  activityEquipment: string | null;
  activityDuration: string;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto: string | null;
  };
  minAge: number;
  maxAge: number;
  ageLimit: string;
  price: number | null;
  status: ActivityStatus;
  rejectionReason: string | null;
  isJoined: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface NotificationRow {
  id: string;
  notificationTitle: string;
  messageContent: string;
  audience: Audience;
  sentDate: string;
  status: NotificationStatus;
}

export interface DashboardStatistics {
  totalUsers: number;
  totalActivities: number;
  totalRegistrations: number;
  pendingApprovals: number;
}

export interface CategoryDistributionRow {
  categoryName: string;
  activityCount: number;
  percentage: number;
}

export interface RecentUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string | null;
  dateJoined: string;
  status: UserStatus;
}

export interface RecentActivityRow {
  id: string;
  activityName: string;
  activityPhoto: string | null;
  activityLocation: string;
  categoryName: string;
  activityDate: string;
  status: ActivityStatus;
}

export interface UploadResult {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Dashboard', 'Users', 'User', 'Activities', 'Activity', 'Categories', 'Notifications'],
  endpoints: (builder) => ({
    // ---- Auth ----
    adminLogin: builder.mutation<
      ApiEnvelope<{ accessToken: string; refreshToken: string; user: AuthUser }>,
      { email: string; password: string; rememberMe?: boolean }
    >({
      query: (body) => ({ url: '/auth/admin/login', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation<ApiEnvelope<{ email: string; otpSent: boolean }>, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<
      ApiEnvelope<null>,
      { email: string; otpCode: string; newPassword: string; confirmPassword: string }
    >({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),

    // ---- Uploads ----
    uploadFile: builder.mutation<ApiEnvelope<UploadResult>, FormData>({
      query: (formData) => ({ url: '/uploads', method: 'POST', body: formData }),
    }),

    // ---- My profile (works for the logged-in admin too, not role-restricted) ----
    updateMyProfilePhoto: builder.mutation<ApiEnvelope<{ profilePhoto: string | null }>, { profilePhoto: string }>({
      query: (body) => ({ url: '/users/me/profile-photo', method: 'PATCH', body }),
    }),

    // ---- Dashboard ----
    getStatistics: builder.query<ApiEnvelope<DashboardStatistics>, void>({
      query: () => '/dashboard/statistics',
      providesTags: ['Dashboard'],
    }),
    getCategoryDistribution: builder.query<ApiEnvelope<CategoryDistributionRow[]>, void>({
      query: () => '/dashboard/category-distribution',
      providesTags: ['Dashboard'],
    }),
    getRecentUsers: builder.query<ApiEnvelope<RecentUserRow[]>, { limit?: number } | void>({
      query: (params) => ({ url: '/dashboard/recent-users', params: params ?? undefined }),
      providesTags: ['Dashboard'],
    }),
    getRecentActivities: builder.query<ApiEnvelope<RecentActivityRow[]>, { limit?: number } | void>({
      query: (params) => ({ url: '/dashboard/recent-activities', params: params ?? undefined }),
      providesTags: ['Dashboard'],
    }),

    // ---- Users ----
    getUsers: builder.query<
      ApiEnvelope<AdminUserRow[]>,
      { page?: number; limit?: number; search?: string; status?: string; tab?: string }
    >({
      query: (params) => ({ url: '/users/admin/users', params }),
      providesTags: ['Users'],
    }),
    getUserDetails: builder.query<ApiEnvelope<AdminUserDetails>, string>({
      query: (userId) => `/users/admin/users/${userId}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    updateUserStatus: builder.mutation<
      ApiEnvelope<AdminUserDetails>,
      { userId: string; status: UserStatus }
    >({
      query: ({ userId, status }) => ({
        url: `/users/admin/users/${userId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { userId }) => ['Users', { type: 'User', id: userId }],
    }),

    // ---- Categories (mobile-shared, active only — used for filter dropdowns) ----
    getActiveCategories: builder.query<ApiEnvelope<CategoryItem[]>, void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    // ---- Activities ----
    getActivities: builder.query<
      ApiEnvelope<ActivityCard[]>,
      { page?: number; limit?: number; status?: string; categoryId?: string; activityDate?: string; search?: string }
    >({
      query: (params) => ({ url: '/activities/admin/activities', params }),
      providesTags: ['Activities'],
    }),
    getActivityDetails: builder.query<ApiEnvelope<ActivityDetails>, string>({
      query: (id) => `/activities/admin/activities/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Activity', id }],
    }),
    updateActivityStatus: builder.mutation<
      ApiEnvelope<ActivityDetails>,
      { id: string; status: 'Approved' | 'Rejected'; rejectionReason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/activities/admin/activities/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ['Activities', 'Dashboard', { type: 'Activity', id }],
    }),
    deleteActivity: builder.mutation<ApiEnvelope<null>, string>({
      query: (id) => ({ url: `/activities/admin/activities/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Activities', 'Dashboard'],
    }),

    // ---- Categories (admin) ----
    getCategories: builder.query<
      ApiEnvelope<{ stats: AdminCategoryStats; categories: AdminCategoryRow[] }>,
      { page?: number; limit?: number; search?: string; status?: string }
    >({
      query: (params) => ({ url: '/categories/admin/categories', params }),
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation<ApiEnvelope<CategoryItem>, { categoryName: string }>({
      query: (body) => ({ url: '/categories/admin/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation<
      ApiEnvelope<CategoryItem>,
      { id: string; categoryName?: string; status?: CategoryStatus }
    >({
      query: ({ id, ...body }) => ({ url: `/categories/admin/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation<ApiEnvelope<null>, string>({
      query: (id) => ({ url: `/categories/admin/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),

    // ---- Notifications ----
    getNotifications: builder.query<
      ApiEnvelope<NotificationRow[]>,
      { page?: number; limit?: number; audience?: string; status?: string }
    >({
      query: (params) => ({ url: '/notifications/admin/notifications', params }),
      providesTags: ['Notifications'],
    }),
    composeNotification: builder.mutation<
      ApiEnvelope<NotificationRow>,
      { notificationTitle: string; messageContent: string; audience: Audience }
    >({
      query: (body) => ({ url: '/notifications/admin/notifications', method: 'POST', body }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUploadFileMutation,
  useUpdateMyProfilePhotoMutation,
  useGetStatisticsQuery,
  useGetCategoryDistributionQuery,
  useGetRecentUsersQuery,
  useGetRecentActivitiesQuery,
  useGetUsersQuery,
  useGetUserDetailsQuery,
  useUpdateUserStatusMutation,
  useGetActiveCategoriesQuery,
  useGetActivitiesQuery,
  useGetActivityDetailsQuery,
  useUpdateActivityStatusMutation,
  useDeleteActivityMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetNotificationsQuery,
  useComposeNotificationMutation,
} = apiSlice;
