import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActivityStatus, Difficulty } from '../../../common/enums';
import { numericTransformer } from '../../../common/utils/numeric.transformer';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Figma: "What are you doing?" — Activity name */
  @Column({ name: 'activity_name' })
  activityName: string;

  @Index()
  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /** Figma: "Descriptions" */
  @Column({ type: 'text' })
  descriptions: string;

  /** Figma: "Maximum number of participants" */
  @Column({ name: 'maximum_number_of_participants', type: 'int' })
  maximumNumberOfParticipants: number;

  /** Figma: "Activity Photo" */
  @Column({ name: 'activity_photo', type: 'varchar', nullable: true })
  activityPhoto: string | null;

  /** Figma: "Activity Date" */
  @Index()
  @Column({ name: 'activity_date', type: 'date' })
  activityDate: string;

  /** Figma: "Activity Time" */
  @Column({ name: 'activity_time', type: 'time' })
  activityTime: string;

  /** Figma: "Activity Duration" (e.g. "1 Hour") */
  @Column({ name: 'activity_duration' })
  activityDuration: string;

  /** Figma: "Activity Equipment (if any)" */
  @Column({ name: 'activity_equipment', type: 'varchar', nullable: true })
  activityEquipment: string | null;

  /** Figma: "Activity Location" */
  @Column({ name: 'activity_location' })
  activityLocation: string;

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

  /** Figma: "Participant Age Range" — lower bound */
  @Column({ name: 'min_age', type: 'int' })
  minAge: number;

  /** Figma: "Participant Age Range" — upper bound */
  @Column({ name: 'max_age', type: 'int' })
  maxAge: number;

  /** Figma: "Price (if applicable)" */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  price: number | null;

  /** Figma: "Difficulty" (Practical info) */
  @Column({ type: 'enum', enum: Difficulty, default: Difficulty.Beginner })
  difficulty: Difficulty;

  @Index()
  @Column({ type: 'enum', enum: ActivityStatus, default: ActivityStatus.Pending })
  status: ActivityStatus;

  @Column({ name: 'rejection_reason', type: 'varchar', nullable: true })
  rejectionReason: string | null;

  /** Figma: "Organizer" */
  @Index()
  @Column({ name: 'organizer_id' })
  organizerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
