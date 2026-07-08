export interface FavoriteItem {
  id: string;
  activityId: string;
  activityName: string;
  activityPhoto: string | null;
  categoryName: string;
  activityDate: string;
  activityTime: string;
  activityLocation: string;
  participants: string;
  createdAt: Date;
}
