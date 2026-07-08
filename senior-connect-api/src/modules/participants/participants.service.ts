import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityStatus, ParticipantStatus } from '../../common/enums';
import {
  AuthenticatedUser,
  ServiceResponse,
} from '../../common/interfaces/api-response.interface';
import { buildMeta, getPagination } from '../../common/utils/pagination.util';
import { Activity } from '../activities/entities';
import { User } from '../users/entities';
import { ParticipantItem } from './interfaces/participants.interface';
import { ActivityParticipant } from './entities';
import { ListParticipantsDto } from './dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(ActivityParticipant)
    private readonly participantRepository: Repository<ActivityParticipant>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Figma Activity Details — Join ("✓ You're going!") */
  async join(
    currentUser: AuthenticatedUser,
    activityId: string,
  ): Promise<ServiceResponse<{ participants: string }>> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.status !== ActivityStatus.Approved) {
      throw new BadRequestException('This activity is not open for joining');
    }
    if (activity.organizerId === currentUser.userId) {
      throw new BadRequestException('You are the organizer of this activity');
    }

    const existing = await this.participantRepository.findOne({
      where: { activityId, userId: currentUser.userId },
    });
    if (existing && existing.status === ParticipantStatus.Joined) {
      throw new ConflictException('You have already joined this activity');
    }

    const joinedCount = await this.participantRepository.count({
      where: { activityId, status: ParticipantStatus.Joined },
    });
    if (joinedCount >= activity.maximumNumberOfParticipants) {
      throw new ConflictException('This activity is full');
    }

    // "Age Limit" enforcement
    const user = await this.userRepository.findOne({ where: { id: currentUser.userId } });
    if (user?.dateOfBirth) {
      const age = this.calculateAge(user.dateOfBirth);
      if (age < activity.minAge || age > activity.maxAge) {
        throw new BadRequestException(
          `Age Limit: ${activity.minAge} Years to ${activity.maxAge} Years`,
        );
      }
    }

    if (existing) {
      existing.status = ParticipantStatus.Joined;
      await this.participantRepository.save(existing);
    } else {
      await this.participantRepository.save(
        this.participantRepository.create({ activityId, userId: currentUser.userId }),
      );
    }

    return {
      message: "You're going!",
      data: { participants: `${joinedCount + 1}/${activity.maximumNumberOfParticipants}` },
    };
  }

  /** Leave a joined activity */
  async leave(currentUser: AuthenticatedUser, activityId: string): Promise<ServiceResponse<null>> {
    const participant = await this.participantRepository.findOne({
      where: { activityId, userId: currentUser.userId, status: ParticipantStatus.Joined },
    });
    if (!participant) throw new NotFoundException('You have not joined this activity');
    participant.status = ParticipantStatus.Cancelled;
    await this.participantRepository.save(participant);
    return { message: 'You left the activity', data: null };
  }

  /** Participants list (name, country, age) */
  async list(
    activityId: string,
    query: ListParticipantsDto,
  ): Promise<ServiceResponse<ParticipantItem[]>> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');

    const { page, limit, skip } = getPagination(query);
    const [participants, total] = await this.participantRepository.findAndCount({
      where: { activityId, status: ParticipantStatus.Joined },
      relations: { user: true },
      order: { joinedAt: 'ASC' },
      skip,
      take: limit,
    });

    const data: ParticipantItem[] = participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      profilePhoto: p.user.profilePhoto,
      country: p.user.country,
      age: p.user.dateOfBirth ? this.calculateAge(p.user.dateOfBirth) : null,
      joinedAt: p.joinedAt,
    }));

    return {
      message: 'Participants retrieved successfully',
      data,
      meta: buildMeta(page, limit, total),
    };
  }

  private calculateAge(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
    return age;
  }
}
