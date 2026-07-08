import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import {
  ActivityStatus,
  ActivityTab,
  CategoryStatus,
  Difficulty,
  ParticipantStatus,
} from '../../common/enums';
import {
  AuthenticatedUser,
  ServiceResponse,
} from '../../common/interfaces/api-response.interface';
import { distanceKm } from '../../common/utils/distance.util';
import { buildMeta, getPagination } from '../../common/utils/pagination.util';
import { Category } from '../categories/entities';
import { Favorite } from '../favorites/entities';
import { ActivityParticipant } from '../participants/entities';
import { User } from '../users/entities';
import { ActivityCard, ActivityDetails } from './interfaces/activities.interface';
import { Activity } from './entities';
import {
  AdminListActivitiesDto,
  CreateActivityDto,
  DiscoverActivitiesDto,
  MyActivitiesDto,
  UpdateActivityDto,
  UpdateActivityStatusDto,
} from './dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ActivityParticipant)
    private readonly participantRepository: Repository<ActivityParticipant>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Figma "Create Activities" flow (Draft or Pending) */
  async create(
    currentUser: AuthenticatedUser,
    dto: CreateActivityDto,
  ): Promise<ServiceResponse<ActivityDetails>> {
    let categoryId = dto.categoryId;
    if (!categoryId && dto.categoryName) {
      // "Add Category name" — user-proposed category, Disabled until admin review
      let category = await this.categoryRepository
        .createQueryBuilder('category')
        .where('LOWER(category.categoryName) = LOWER(:name)', { name: dto.categoryName })
        .getOne();
      if (!category) {
        category = await this.categoryRepository.save(
          this.categoryRepository.create({
            categoryName: dto.categoryName,
            status: CategoryStatus.Disabled,
          }),
        );
      }
      categoryId = category.id;
    }
    if (!categoryId) throw new NotFoundException('Category is required');
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const activity = await this.activityRepository.save(
      this.activityRepository.create({
        activityName: dto.activityName,
        categoryId,
        descriptions: dto.descriptions,
        maximumNumberOfParticipants: dto.maximumNumberOfParticipants,
        activityPhoto: dto.activityPhoto ?? null,
        activityDate: dto.activityDate,
        activityTime: dto.activityTime,
        activityDuration: dto.activityDuration,
        activityEquipment: dto.activityEquipment ?? null,
        activityLocation: dto.activityLocation,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        minAge: dto.minAge,
        maxAge: dto.maxAge,
        price: dto.price ?? null,
        difficulty: dto.difficulty ?? Difficulty.Beginner,
        status: dto.saveAsDraft ? ActivityStatus.Draft : ActivityStatus.Pending,
        organizerId: currentUser.userId,
      }),
    );
    const data = await this.buildDetails(activity.id, currentUser);
    return {
      message: dto.saveAsDraft
        ? 'Activity saved as draft'
        : 'Activity submitted for approval',
      data,
    };
  }

  /** Figma "Discover" — search, category chips, Apply Filter, Map/List view */
  async discover(
    currentUser: AuthenticatedUser,
    query: DiscoverActivitiesDto,
  ): Promise<ServiceResponse<ActivityCard[]>> {
    const { page, limit, skip } = getPagination(query);

    const qb = this.baseVisibleQuery(currentUser.userId)
      .andWhere('activity.status = :approved', { approved: ActivityStatus.Approved })
      .andWhere('activity.activityDate >= CURRENT_DATE');

    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('activity.activityName ILIKE :search', { search: `%${query.search}%` })
            .orWhere('activity.activityLocation ILIKE :search', { search: `%${query.search}%` })
            .orWhere('activity.descriptions ILIKE :search', { search: `%${query.search}%` });
        }),
      );
    }
    if (query.categoryId) {
      qb.andWhere('activity.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.activityDate) {
      qb.andWhere('activity.activityDate = :activityDate', { activityDate: query.activityDate });
    }
    if (query.minAge !== undefined) {
      qb.andWhere('activity.maxAge >= :minAge', { minAge: query.minAge });
    }
    if (query.maxAge !== undefined) {
      qb.andWhere('activity.minAge <= :maxAge', { maxAge: query.maxAge });
    }

    qb.orderBy('activity.activityDate', 'ASC').addOrderBy('activity.activityTime', 'ASC');

    let activities = await qb.getMany();

    // "Activity distances" filter (km) with user coordinates
    const userLat = query.latitude ?? null;
    const userLng = query.longitude ?? null;
    if (query.maxDistance !== undefined && userLat !== null && userLng !== null) {
      activities = activities.filter(
        (activity) =>
          activity.latitude !== null &&
          activity.longitude !== null &&
          distanceKm(userLat, userLng, activity.latitude, activity.longitude) <=
            Number(query.maxDistance),
      );
    }

    const total = activities.length;
    const pageItems = query.view === 'map' ? activities : activities.slice(skip, skip + limit);
    const cards = await this.toCards(pageItems, userLat, userLng);

    return {
      message: 'Activities retrieved successfully',
      data: cards,
      meta: buildMeta(page, query.view === 'map' ? total || 1 : limit, total),
    };
  }

  /** Figma Home — "Featured this weekend" */
  async featured(currentUser: AuthenticatedUser): Promise<ServiceResponse<ActivityCard[]>> {
    const now = new Date();
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const daysUntilSaturday = (6 - day + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    const toIso = (d: Date): string => d.toISOString().slice(0, 10);

    const activities = await this.baseVisibleQuery(currentUser.userId)
      .andWhere('activity.status = :approved', { approved: ActivityStatus.Approved })
      .andWhere('activity.activityDate BETWEEN :start AND :end', {
        start: toIso(day === 0 ? now : saturday),
        end: toIso(sunday),
      })
      .orderBy('activity.activityDate', 'ASC')
      .take(10)
      .getMany();

    const user = await this.userRepository.findOne({ where: { id: currentUser.userId } });
    const cards = await this.toCards(activities, user?.latitude ?? null, user?.longitude ?? null);
    return { message: 'Featured activities retrieved successfully', data: cards };
  }

  /** Figma Activities tab — "My Activities" (All | Upcoming | Past) */
  async myActivities(
    currentUser: AuthenticatedUser,
    query: MyActivitiesDto,
  ): Promise<ServiceResponse<ActivityCard[]>> {
    const { page, limit, skip } = getPagination(query);
    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .where('activity.organizerId = :userId', { userId: currentUser.userId });
    this.applyTab(qb, query.tab);
    qb.orderBy('activity.activityDate', 'DESC').skip(skip).take(limit);
    const [activities, total] = await qb.getManyAndCount();
    return {
      message: 'My activities retrieved successfully',
      data: await this.toCards(activities, null, null),
      meta: buildMeta(page, limit, total),
    };
  }

  /** Figma Activities tab — "Joined Activities" (All | Upcoming | Past) */
  async joinedActivities(
    currentUser: AuthenticatedUser,
    query: MyActivitiesDto,
  ): Promise<ServiceResponse<ActivityCard[]>> {
    const { page, limit, skip } = getPagination(query);
    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .innerJoin(
        ActivityParticipant,
        'participant',
        'participant.activityId = activity.id AND participant.userId = :userId AND participant.status = :joined',
        { userId: currentUser.userId, joined: ParticipantStatus.Joined },
      );
    this.applyTab(qb, query.tab);
    qb.orderBy('activity.activityDate', 'DESC').skip(skip).take(limit);
    const [activities, total] = await qb.getManyAndCount();
    return {
      message: 'Joined activities retrieved successfully',
      data: await this.toCards(activities, null, null),
      meta: buildMeta(page, limit, total),
    };
  }

  /** Figma "Activity Details" screen */
  async details(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<ServiceResponse<ActivityDetails>> {
    const data = await this.buildDetails(id, currentUser);
    return { message: 'Activity details retrieved successfully', data };
  }

  /** Organizer edits own activity (approved edits go back to Pending) */
  async update(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<ServiceResponse<ActivityDetails>> {
    const activity = await this.findById(id);
    if (activity.organizerId !== currentUser.userId) {
      throw new ForbiddenException('Only the organizer can update this activity');
    }
    const { submit, ...changes } = dto;
    Object.assign(activity, changes);
    if (submit && activity.status === ActivityStatus.Draft) {
      activity.status = ActivityStatus.Pending;
    } else if (activity.status === ActivityStatus.Approved && Object.keys(changes).length > 0) {
      activity.status = ActivityStatus.Pending;
    }
    await this.activityRepository.save(activity);
    const data = await this.buildDetails(id, currentUser);
    return { message: 'Activity updated successfully', data };
  }

  /** Organizer cancels/deletes own activity */
  async remove(currentUser: AuthenticatedUser, id: string): Promise<ServiceResponse<null>> {
    const activity = await this.findById(id);
    if (activity.organizerId !== currentUser.userId) {
      throw new ForbiddenException('Only the organizer can delete this activity');
    }
    await this.activityRepository.remove(activity);
    return { message: 'Activity deleted successfully', data: null };
  }

  /** Admin — activities list with tabs Pending | Approved | Rejected */
  async adminList(query: AdminListActivitiesDto): Promise<ServiceResponse<ActivityCard[]>> {
    const { page, limit, skip } = getPagination(query);
    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.organizer', 'organizer');
    if (query.status) qb.andWhere('activity.status = :status', { status: query.status });
    if (query.categoryId) {
      qb.andWhere('activity.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.activityDate) {
      qb.andWhere('activity.activityDate = :activityDate', {
        activityDate: query.activityDate,
      });
    }
    if (query.search) {
      qb.andWhere('activity.activityName ILIKE :search', { search: `%${query.search}%` });
    }
    qb.orderBy('activity.createdAt', 'DESC').skip(skip).take(limit);
    const [activities, total] = await qb.getManyAndCount();
    return {
      message: 'Activities retrieved successfully',
      data: await this.toCards(activities, null, null),
      meta: buildMeta(page, limit, total),
    };
  }

  /** Admin — activity details (moderation view) */
  async adminDetails(id: string): Promise<ServiceResponse<ActivityDetails>> {
    const data = await this.buildDetails(id, null);
    return { message: 'Activity details retrieved successfully', data };
  }

  /** Admin — Approve / Reject */
  async adminUpdateStatus(
    id: string,
    dto: UpdateActivityStatusDto,
  ): Promise<ServiceResponse<ActivityDetails>> {
    const activity = await this.findById(id);
    activity.status = dto.status;
    activity.rejectionReason =
      dto.status === ActivityStatus.Rejected ? dto.rejectionReason ?? null : null;
    await this.activityRepository.save(activity);
    const data = await this.buildDetails(id, null);
    return {
      message:
        dto.status === ActivityStatus.Approved
          ? 'Activity approved successfully'
          : 'Activity rejected successfully',
      data,
    };
  }

  /** Admin — delete any activity */
  async adminRemove(id: string): Promise<ServiceResponse<null>> {
    const activity = await this.findById(id);
    await this.activityRepository.remove(activity);
    return { message: 'Activity deleted successfully', data: null };
  }

  // ---------- helpers ----------

  private async findById(id: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  /** Approved + not organized by someone the user blocked (or who blocked the user). */
  private baseVisibleQuery(userId: string): SelectQueryBuilder<Activity> {
    return this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.organizer', 'organizer')
      .where(
        `activity.organizerId NOT IN (
           SELECT blocked_id FROM blocked_users WHERE blocker_id = :userId
           UNION
           SELECT blocker_id FROM blocked_users WHERE blocked_id = :userId
         )`,
        { userId },
      );
  }

  private applyTab(qb: SelectQueryBuilder<Activity>, tab?: ActivityTab): void {
    if (tab === ActivityTab.Upcoming) {
      qb.andWhere('activity.activityDate >= CURRENT_DATE');
    } else if (tab === ActivityTab.Past) {
      qb.andWhere('activity.activityDate < CURRENT_DATE');
    }
  }

  private async joinedCount(activityId: string): Promise<number> {
    return this.participantRepository.count({
      where: { activityId, status: ParticipantStatus.Joined },
    });
  }

  private async toCards(
    activities: Activity[],
    userLat: number | null,
    userLng: number | null,
  ): Promise<ActivityCard[]> {
    return Promise.all(
      activities.map(async (activity) => {
        const joinedCount = await this.joinedCount(activity.id);
        return {
          id: activity.id,
          activityName: activity.activityName,
          activityPhoto: activity.activityPhoto,
          categoryName: activity.category?.categoryName ?? '',
          activityDate: activity.activityDate,
          activityTime: activity.activityTime,
          activityLocation: activity.activityLocation,
          latitude: activity.latitude,
          longitude: activity.longitude,
          participants: `${joinedCount}/${activity.maximumNumberOfParticipants}`,
          joinedCount,
          maximumNumberOfParticipants: activity.maximumNumberOfParticipants,
          distanceKm:
            userLat !== null &&
            userLng !== null &&
            activity.latitude !== null &&
            activity.longitude !== null
              ? Math.round(
                  distanceKm(userLat, userLng, activity.latitude, activity.longitude) * 10,
                ) / 10
              : null,
          status: activity.status,
          organizer: {
            id: activity.organizer?.id ?? activity.organizerId,
            firstName: activity.organizer?.firstName ?? '',
            lastName: activity.organizer?.lastName ?? '',
            profilePhoto: activity.organizer?.profilePhoto ?? null,
          },
        };
      }),
    );
  }

  private async buildDetails(
    id: string,
    currentUser: AuthenticatedUser | null,
  ): Promise<ActivityDetails> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: { category: true, organizer: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const joinedCount = await this.joinedCount(id);
    const participants = await this.participantRepository.find({
      where: { activityId: id, status: ParticipantStatus.Joined },
      relations: { user: true },
      take: 5,
      order: { joinedAt: 'ASC' },
    });

    let isJoined = false;
    let isFavorite = false;
    let userLat: number | null = null;
    let userLng: number | null = null;
    if (currentUser) {
      isJoined =
        (await this.participantRepository.count({
          where: {
            activityId: id,
            userId: currentUser.userId,
            status: ParticipantStatus.Joined,
          },
        })) > 0;
      isFavorite =
        (await this.favoriteRepository.count({
          where: { activityId: id, userId: currentUser.userId },
        })) > 0;
      const user = await this.userRepository.findOne({ where: { id: currentUser.userId } });
      userLat = user?.latitude ?? null;
      userLng = user?.longitude ?? null;
    }

    return {
      id: activity.id,
      activityName: activity.activityName,
      activityPhoto: activity.activityPhoto,
      category: {
        id: activity.category.id,
        categoryName: activity.category.categoryName,
      },
      activityDate: activity.activityDate,
      activityTime: activity.activityTime,
      activityLocation: activity.activityLocation,
      latitude: activity.latitude,
      longitude: activity.longitude,
      distanceKm:
        userLat !== null &&
        userLng !== null &&
        activity.latitude !== null &&
        activity.longitude !== null
          ? Math.round(distanceKm(userLat, userLng, activity.latitude, activity.longitude) * 10) /
            10
          : null,
      participants: `${joinedCount}/${activity.maximumNumberOfParticipants}`,
      joinedCount,
      maximumNumberOfParticipants: activity.maximumNumberOfParticipants,
      participantAvatars: participants.map((p) => p.user?.profilePhoto ?? null),
      descriptions: activity.descriptions,
      difficulty: activity.difficulty,
      activityEquipment: activity.activityEquipment,
      activityDuration: activity.activityDuration,
      organizer: {
        id: activity.organizer.id,
        firstName: activity.organizer.firstName,
        lastName: activity.organizer.lastName,
        email: activity.organizer.email,
        profilePhoto: activity.organizer.profilePhoto,
      },
      minAge: activity.minAge,
      maxAge: activity.maxAge,
      ageLimit: `${activity.minAge} Years to ${activity.maxAge} Years`,
      price: activity.price,
      status: activity.status,
      rejectionReason: activity.rejectionReason,
      isJoined,
      isFavorite,
      createdAt: activity.createdAt,
    };
  }
}
