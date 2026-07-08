import { NotificationAudience, NotificationStatus } from '../../../common/enums';

export interface NotificationRow {
  id: string;
  notificationTitle: string;
  messageContent: string;
  audience: NotificationAudience;
  sentDate: Date;
  status: NotificationStatus;
}

export interface MyNotificationRow extends NotificationRow {
  isRead: boolean;
  readAt: Date | null;
}
