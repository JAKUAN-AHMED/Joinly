import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationAudience, NotificationStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Figma: "Notification Title" */
  @Column({ name: 'notification_title' })
  notificationTitle: string;

  /** Figma: "Message Content" */
  @Column({ name: 'message_content', type: 'text' })
  messageContent: string;

  /** Figma: "AUDIENCE" — Everyone | Seniors | Volunteers */
  @Column({ type: 'enum', enum: NotificationAudience, default: NotificationAudience.Everyone })
  audience: NotificationAudience;

  /** Figma: "STATUS" — Delivered | Failed */
  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.Delivered })
  status: NotificationStatus;

  @Column({ name: 'sent_by', type: 'uuid', nullable: true })
  sentBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sent_by' })
  sender: User | null;

  /** Figma: "SENT DATE" */
  @CreateDateColumn({ name: 'sent_date' })
  sentDate: Date;
}
