import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('blocked_users')
@Unique(['blockerId', 'blockedId'])
export class BlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'blocker_id' })
  blockerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  @Column({ name: 'blocked_id' })
  blockedId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
