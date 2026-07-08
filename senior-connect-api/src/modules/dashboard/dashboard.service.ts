import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ActivityStatus, ParticipantStatus, UserRole } from '../../common/enums';
import { ServiceResponse } from '../../common/interfaces/api-response.interface';
import { Activity } from '../activities/entities';
import { Category } from '../categories/entities';
import { ActivityParticipant } from '../participants/entities';
import { User } from '../users/entities';
import {
  CategoryDistributionRow,
  DashboardStatistics,
  RecentActivityRow,
  RecentUserRow,
} from './interfaces/dashboard.interface';
import { RecentListDto } from './dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityParticipant)
    private readonly participantRepository: Repository<ActivityParticipant>,
  ) {}

  /** Figma stat cards */
  async statistics(): Promise<ServiceResponse<DashboardStatistics>> {
    const data: DashboardStatistics = {
      totalUsers: await this.userRepository.count({ where: { role: UserRole.User } }),
      totalActivities: await this.activityRepository.count(),
      totalRegistrations: await this.participantRepository.count({
        where: { status: ParticipantStatus.Joined },
      }),
      pendingApprovals: await this.activityRepository.count({
        where: { status: ActivityStatus.Pending },
      }),
    };
    return { message: 'Dashboard statistics retrieved successfully', data };
  }

  /** Figma "Category Distribution — Activity breakdown across the community." */
  async categoryDistribution(): Promise<ServiceResponse<CategoryDistributionRow[]>> {
    const rows: { categoryName: string; count: string }[] = await this.activityRepository
      .createQueryBuilder('activity')
      .innerJoin(Category, 'category', 'category.id = activity.categoryId')
      .select('category.categoryName', 'categoryName')
      .addSelect('COUNT(activity.id)', 'count')
      .groupBy('category.categoryName')
      .orderBy('count', 'DESC')
      .getRawMany();

    const total = rows.reduce((sum, row) => sum + Number(row.count), 0);
    const data: CategoryDistributionRow[] = rows.map((row) => ({
      categoryName: row.categoryName,
      activityCount: Number(row.count),
      percentage: total > 0 ? Math.round((Number(row.count) / total) * 100) : 0,
    }));
    return { message: 'Category distribution retrieved successfully', data };
  }

  /** Figma "Recent Users — New members who joined in the last 24 hours." */
  async recentUsers(query: RecentListDto): Promise<ServiceResponse<RecentUserRow[]>> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users = await this.userRepository.find({
      where: { role: UserRole.User, createdAt: MoreThanOrEqual(since) },
      order: { createdAt: 'DESC' },
      take: Math.min(50, Number(query.limit) || 10),
    });
    const data: RecentUserRow[] = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      dateJoined: user.createdAt,
      status: user.status,
    }));
    return { message: 'Recent users retrieved successfully', data };
  }

  /** Figma "Recent Activities — Latest events scheduled across the network." */
  async recentActivities(query: RecentListDto): Promise<ServiceResponse<RecentActivityRow[]>> {
    const activities = await this.activityRepository.find({
      relations: { category: true },
      order: { createdAt: 'DESC' },
      take: Math.min(50, Number(query.limit) || 10),
    });
    const data: RecentActivityRow[] = activities.map((activity) => ({
      id: activity.id,
      activityName: activity.activityName,
      activityPhoto: activity.activityPhoto,
      activityLocation: activity.activityLocation,
      categoryName: activity.category?.categoryName ?? '',
      activityDate: activity.activityDate,
      status: activity.status,
    }));
    return { message: 'Recent activities retrieved successfully', data };
  }
}
