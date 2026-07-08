import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantStatus } from '../../common/enums';
import {
  AuthenticatedUser,
  ServiceResponse,
} from '../../common/interfaces/api-response.interface';
import { buildMeta, getPagination } from '../../common/utils/pagination.util';
import { Activity } from '../activities/entities';
import { ActivityParticipant } from '../participants/entities';
import { FavoriteItem } from './interfaces/favorites.interface';
import { Favorite } from './entities';
import { ListFavoritesDto } from './dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivityParticipant)
    private readonly participantRepository: Repository<ActivityParticipant>,
  ) {}

  /** Add to Favorite Activities */
  async add(currentUser: AuthenticatedUser, activityId: string): Promise<ServiceResponse<null>> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');
    const existing = await this.favoriteRepository.findOne({
      where: { userId: currentUser.userId, activityId },
    });
    if (existing) throw new ConflictException('Activity is already in favorites');
    await this.favoriteRepository.save(
      this.favoriteRepository.create({ userId: currentUser.userId, activityId }),
    );
    return { message: 'Added to favorite activities', data: null };
  }

  /** Remove from Favorite Activities */
  async remove(currentUser: AuthenticatedUser, activityId: string): Promise<ServiceResponse<null>> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId: currentUser.userId, activityId },
    });
    if (!favorite) throw new NotFoundException('Activity is not in favorites');
    await this.favoriteRepository.remove(favorite);
    return { message: 'Removed from favorite activities', data: null };
  }

  /** Figma — "Favorite Activities: View and manage favorite Activity" */
  async list(
    currentUser: AuthenticatedUser,
    query: ListFavoritesDto,
  ): Promise<ServiceResponse<FavoriteItem[]>> {
    const { page, limit, skip } = getPagination(query);
    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { userId: currentUser.userId },
      relations: { activity: { category: true } },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data: FavoriteItem[] = await Promise.all(
      favorites.map(async (favorite) => {
        const joinedCount = await this.participantRepository.count({
          where: { activityId: favorite.activityId, status: ParticipantStatus.Joined },
        });
        return {
          id: favorite.id,
          activityId: favorite.activityId,
          activityName: favorite.activity.activityName,
          activityPhoto: favorite.activity.activityPhoto,
          categoryName: favorite.activity.category?.categoryName ?? '',
          activityDate: favorite.activity.activityDate,
          activityTime: favorite.activity.activityTime,
          activityLocation: favorite.activity.activityLocation,
          participants: `${joinedCount}/${favorite.activity.maximumNumberOfParticipants}`,
          createdAt: favorite.createdAt,
        };
      }),
    );

    return {
      message: 'Favorite activities retrieved successfully',
      data,
      meta: buildMeta(page, limit, total),
    };
  }
}
