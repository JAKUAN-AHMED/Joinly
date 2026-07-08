import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { ParticipantStatus, UserStatus } from '../../common/enums';
import {
  AuthenticatedUser,
  ServiceResponse,
} from '../../common/interfaces/api-response.interface';
import { buildMeta, getPagination } from '../../common/utils/pagination.util';
import { Activity } from '../activities/entities';
import { Category } from '../categories/entities';
import { ActivityParticipant } from '../participants/entities';
import {
  AdminUserDetails,
  AdminUserRow,
  BlockedUserRow,
  MyProfileResponse,
  UserProfile,
} from './interfaces/users.interface';
import { BlockedUser, User, UserInterest } from './entities';
import {
  AdminListUsersDto,
  UpdateAppPreferencesDto,
  UpdateInterestsDto,
  UpdateLocationDto,
  UpdateProfileDto,
  UpdateProfilePhotoDto,
  UpdateUserStatusDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserInterest)
    private readonly userInterestRepository: Repository<UserInterest>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityParticipant)
    private readonly participantRepository: Repository<ActivityParticipant>,
  ) {}

  /** Figma Profile screen — profile + counters + interests */
  async getMyProfile(
    currentUser: AuthenticatedUser,
  ): Promise<ServiceResponse<MyProfileResponse>> {
    const data = await this.buildProfile(currentUser.userId);
    return { message: 'Profile retrieved successfully', data };
  }

  /** Figma "Edit Profile" — firstName, lastName, phoneNumber, dateOfBirth */
  async updateProfile(
    currentUser: AuthenticatedUser,
    dto: UpdateProfileDto,
  ): Promise<ServiceResponse<UserProfile>> {
    const user = await this.findById(currentUser.userId);
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return { message: 'Profile updated successfully', data: this.toProfile(user) };
  }

  /** Onboarding 1 of 3 — "Your location" */
  async updateLocation(
    currentUser: AuthenticatedUser,
    dto: UpdateLocationDto,
  ): Promise<ServiceResponse<UserProfile>> {
    const hasGps = dto.latitude !== undefined && dto.longitude !== undefined;
    const hasManual = Boolean(dto.country || dto.region || dto.city);
    if (!hasGps && !hasManual) {
      throw new BadRequestException(
        'Provide GPS coordinates (Enable Location) or country/region/city (Enter Location Manually)',
      );
    }
    const user = await this.findById(currentUser.userId);
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return { message: 'Location updated successfully', data: this.toProfile(user) };
  }

  /** Onboarding 2 of 3 — "Choose Interests" */
  async updateInterests(
    currentUser: AuthenticatedUser,
    dto: UpdateInterestsDto,
  ): Promise<ServiceResponse<{ interests: { id: string; categoryName: string }[] }>> {
    const categories = await this.categoryRepository.find({
      where: { id: In(dto.categoryIds) },
    });
    if (categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('One or more selected interests do not exist');
    }
    await this.userInterestRepository.delete({ userId: currentUser.userId });
    await this.userInterestRepository.save(
      dto.categoryIds.map((categoryId) =>
        this.userInterestRepository.create({ userId: currentUser.userId, categoryId }),
      ),
    );
    return {
      message: 'Interests updated successfully',
      data: {
        interests: categories.map((c) => ({
          id: c.id,
          categoryName: c.categoryName,
        })),
      },
    };
  }

  /** Onboarding 3 of 3 — "Profile Photo" */
  async updateProfilePhoto(
    currentUser: AuthenticatedUser,
    dto: UpdateProfilePhotoDto,
  ): Promise<ServiceResponse<UserProfile>> {
    const user = await this.findById(currentUser.userId);
    user.profilePhoto = dto.profilePhoto;
    await this.userRepository.save(user);
    return { message: 'Profile photo updated successfully', data: this.toProfile(user) };
  }

  /** Figma "App Preferences" — Language, Date Format, Notification Sounds */
  async updateAppPreferences(
    currentUser: AuthenticatedUser,
    dto: UpdateAppPreferencesDto,
  ): Promise<ServiceResponse<UserProfile>> {
    const user = await this.findById(currentUser.userId);
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return { message: 'App preferences updated successfully', data: this.toProfile(user) };
  }

  /** Figma participant profile — "Block" */
  async blockUser(
    currentUser: AuthenticatedUser,
    userId: string,
  ): Promise<ServiceResponse<null>> {
    if (currentUser.userId === userId) {
      throw new BadRequestException('You cannot block yourself');
    }
    await this.findById(userId);
    const existing = await this.blockedUserRepository.findOne({
      where: { blockerId: currentUser.userId, blockedId: userId },
    });
    if (existing) throw new ConflictException('User is already blocked');
    await this.blockedUserRepository.save(
      this.blockedUserRepository.create({
        blockerId: currentUser.userId,
        blockedId: userId,
      }),
    );
    return { message: 'User blocked successfully', data: null };
  }

  async unblockUser(
    currentUser: AuthenticatedUser,
    userId: string,
  ): Promise<ServiceResponse<null>> {
    const existing = await this.blockedUserRepository.findOne({
      where: { blockerId: currentUser.userId, blockedId: userId },
    });
    if (!existing) throw new NotFoundException('User is not blocked');
    await this.blockedUserRepository.remove(existing);
    return { message: 'User unblocked successfully', data: null };
  }

  /** Figma Profile — "Blocked Users" screen */
  async listBlockedUsers(
    currentUser: AuthenticatedUser,
  ): Promise<ServiceResponse<BlockedUserRow[]>> {
    const rows = await this.blockedUserRepository.find({
      where: { blockerId: currentUser.userId },
      relations: ['blocked'],
      order: { createdAt: 'DESC' },
    });
    const data = rows.map((row) => ({
      id: row.blocked.id,
      firstName: row.blocked.firstName,
      lastName: row.blocked.lastName,
      profilePhoto: row.blocked.profilePhoto,
    }));
    return { message: 'Blocked users retrieved successfully', data };
  }

  /** Admin Users table — search by name, email or country; tabs All/Active/Blocked */
  async adminListUsers(query: AdminListUsersDto): Promise<ServiceResponse<AdminUserRow[]>> {
    const { page, limit, skip } = getPagination(query);
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'User' });

    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('user.firstName ILIKE :search', { search: `%${query.search}%` })
            .orWhere('user.lastName ILIKE :search', { search: `%${query.search}%` })
            .orWhere('user.email ILIKE :search', { search: `%${query.search}%` })
            .orWhere('user.country ILIKE :search', { search: `%${query.search}%` });
        }),
      );
    }
    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    } else if (query.tab === 'Active Users') {
      qb.andWhere('user.status = :status', { status: UserStatus.Active });
    } else if (query.tab === 'Blocked Users') {
      qb.andWhere('user.status = :status', { status: UserStatus.Blocked });
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);
    const [users, total] = await qb.getManyAndCount();

    const rows: AdminUserRow[] = await Promise.all(
      users.map(async (user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        email: user.email,
        country: user.country,
        activities:
          (await this.activityRepository.count({ where: { organizerId: user.id } })) +
          (await this.participantRepository.count({
            where: { userId: user.id, status: ParticipantStatus.Joined },
          })),
        status: user.status,
        dateJoined: user.createdAt,
      })),
    );

    return {
      message: 'Users retrieved successfully',
      data: rows,
      meta: buildMeta(page, limit, total),
    };
  }

  /** Admin "User Details" page */
  async adminUserDetails(userId: string): Promise<ServiceResponse<AdminUserDetails>> {
    const profile = await this.buildProfile(userId);

    const createdActivities = await this.activityRepository.find({
      where: { organizerId: userId },
      relations: { category: true },
      order: { activityDate: 'DESC' },
      take: 10,
    });
    const joined = await this.participantRepository.find({
      where: { userId, status: ParticipantStatus.Joined },
      relations: { activity: { category: true } },
      order: { joinedAt: 'DESC' },
      take: 10,
    });

    const toRow = (activity: Activity): Record<string, unknown> => ({
      id: activity.id,
      activityName: activity.activityName,
      categoryName: activity.category?.categoryName ?? '',
      activityDate: activity.activityDate,
      status: activity.status,
    });

    const data: AdminUserDetails = {
      ...profile,
      activitiesJoined: profile.activityJoined,
      activitiesCreated: profile.activityCreated,
      joinedActivities: joined.map((p) => toRow(p.activity)),
      createdActivities: createdActivities.map(toRow),
    };
    return { message: 'User details retrieved successfully', data };
  }

  /** Admin — Active / Inactive / Suspended / Blocked ("Block user") */
  async adminUpdateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<ServiceResponse<UserProfile>> {
    const user = await this.findById(userId);
    user.status = dto.status;
    await this.userRepository.save(user);
    return { message: `User status updated to ${dto.status}`, data: this.toProfile(user) };
  }

  // ---------- helpers ----------

  private async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      language: user.language,
      profilePhoto: user.profilePhoto,
      country: user.country,
      region: user.region,
      city: user.city,
      latitude: user.latitude,
      longitude: user.longitude,
      role: user.role,
      status: user.status,
      dateFormat: user.dateFormat,
      notificationSounds: user.notificationSounds,
      allowNotifications: user.allowNotifications,
      isEmailVerified: user.isEmailVerified,
      memberSince: user.createdAt,
    };
  }

  private async buildProfile(userId: string): Promise<MyProfileResponse> {
    const user = await this.findById(userId);
    const activityJoined = await this.participantRepository.count({
      where: { userId, status: ParticipantStatus.Joined },
    });
    const activityCreated = await this.activityRepository.count({
      where: { organizerId: userId },
    });

    // "Connections" — distinct users who joined the same activities
    const connectionsRow: { count: string } | undefined = await this.participantRepository
      .createQueryBuilder('mine')
      .innerJoin(
        ActivityParticipant,
        'others',
        'others.activityId = mine.activityId AND others.userId != mine.userId',
      )
      .where('mine.userId = :userId', { userId })
      .select('COUNT(DISTINCT others.user_id)', 'count')
      .getRawOne();

    const interests = await this.userInterestRepository.find({
      where: { userId },
      relations: { category: true },
    });

    return {
      ...this.toProfile(user),
      activityJoined,
      activityCreated,
      connections: Number(connectionsRow?.count ?? 0),
      interests: interests.map((i) => ({
        id: i.category.id,
        categoryName: i.category.categoryName,
      })),
    };
  }
}
