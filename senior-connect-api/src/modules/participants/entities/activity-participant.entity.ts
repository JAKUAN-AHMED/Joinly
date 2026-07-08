import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ParticipantStatus } from '../../../common/enums';
import { Activity } from '../../activities/entities/activity.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activity_participants')
@Unique(['activityId', 'userId'])
export class ActivityParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id' })
  activityId: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.Joined })
  status: ParticipantStatus;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
