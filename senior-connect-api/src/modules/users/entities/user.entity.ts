import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '../../../common/enums';
import { numericTransformer } from '../../../common/utils/numeric.transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ default: 'English (United States)' })
  language: string;

  @Column({ name: 'profile_photo', type: 'varchar', nullable: true })
  profilePhoto: string | null;

  @Column({ type: 'varchar', nullable: true })
  country: string | null;

  @Column({ type: 'varchar', nullable: true })
  region: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numericTransformer,
  })
  latitude: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: numericTransformer,
  })
  longitude: number | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.Pending })
  status: UserStatus;

  @Column({ name: 'date_format', default: 'MM/DD/YYYY' })
  dateFormat: string;

  @Column({ name: 'notification_sounds', default: true })
  notificationSounds: boolean;

  @Column({ name: 'allow_notifications', default: true })
  allowNotifications: boolean;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true, select: false })
  refreshToken: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
