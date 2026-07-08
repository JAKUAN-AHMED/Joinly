import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  NotificationAudience,
  NotificationStatus,
  UserRole,
  UserStatus,
} from '../../common/enums';
import {
  AuthenticatedUser,
  ServiceResponse,
} from '../../common/interfaces/api-response.interface';
import { buildMeta, getPagination } from '../../common/utils/pagination.util';
import { User } from '../users/entities';
import { MyNotificationRow, NotificationRow } from './interfaces/notifications.interface';
import { Notification, UserNotification } from './entities';
import { ComposeNotificationDto, ListNotificationsDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Admin "Compose Notification" — Send Notification */
  async compose(
    currentUser: AuthenticatedUser,
    dto: ComposeNotificationDto,
  ): Promise<ServiceResponse<NotificationRow>> {
    const notification = this.notificationRepository.create({
      notificationTitle: dto.notificationTitle,
      messageContent: dto.messageContent,
      audience: dto.audience ?? NotificationAudience.Everyone,
      sentBy: currentUser.userId,
    });

    try {
      await this.notificationRepository.save(notification);
      // fan out to active mobile users who allow notifications
      const recipients = await this.userRepository.find({
        where: {
          role: UserRole.User,
          status: UserStatus.Active,
          allowNotifications: true,
        },
        select: ['id'],
      });
      if (recipients.length > 0) {
        await this.userNotificationRepository
          .createQueryBuilder()
          .insert()
          .values(
            recipients.map((user) => ({
              notificationId: notification.id,
              userId: user.id,
            })),
          )
          .orIgnore()
          .execute();
      }
      notification.status = NotificationStatus.Delivered;
    } catch {
      notification.status = NotificationStatus.Failed;
    }
    await this.notificationRepository.save(notification);

    return {
      message:
        notification.status === NotificationStatus.Delivered
          ? 'Notification sent successfully'
          : 'Notification failed to send',
      data: this.toRow(notification),
    };
  }

  /** Admin "Notification History" — SUBJECT, AUDIENCE, SENT DATE, STATUS */
  async adminList(query: ListNotificationsDto): Promise<ServiceResponse<NotificationRow[]>> {
    const { page, limit, skip } = getPagination(query);
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: {
        ...(query.audience ? { audience: query.audience } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      order: { sentDate: 'DESC' },
      skip,
      take: limit,
    });
    return {
      message: 'Notification history retrieved successfully',
      data: notifications.map((n) => this.toRow(n)),
      meta: buildMeta(page, limit, total),
    };
  }

  /** Mobile — my notifications */
  async myNotifications(
    currentUser: AuthenticatedUser,
    query: ListNotificationsDto,
  ): Promise<ServiceResponse<MyNotificationRow[]>> {
    const { page, limit, skip } = getPagination(query);
    const [rows, total] = await this.userNotificationRepository.findAndCount({
      where: { userId: currentUser.userId },
      relations: { notification: true },
      order: { notification: { sentDate: 'DESC' } },
      skip,
      take: limit,
    });
    return {
      message: 'Notifications retrieved successfully',
      data: rows.map((row) => ({
        ...this.toRow(row.notification),
        id: row.id,
        isRead: row.isRead,
        readAt: row.readAt,
      })),
      meta: buildMeta(page, limit, total),
    };
  }

  /** Mobile — mark as read */
  async markAsRead(currentUser: AuthenticatedUser, id: string): Promise<ServiceResponse<null>> {
    const row = await this.userNotificationRepository.findOne({
      where: [
        { id, userId: currentUser.userId },
        { notificationId: id, userId: currentUser.userId },
      ],
    });
    if (!row) throw new NotFoundException('Notification not found');
    row.isRead = true;
    row.readAt = new Date();
    await this.userNotificationRepository.save(row);
    return { message: 'Notification marked as read', data: null };
  }

  private toRow(notification: Notification): NotificationRow {
    return {
      id: notification.id,
      notificationTitle: notification.notificationTitle,
      messageContent: notification.messageContent,
      audience: notification.audience,
      sentDate: notification.sentDate,
      status: notification.status,
    };
  }
}
