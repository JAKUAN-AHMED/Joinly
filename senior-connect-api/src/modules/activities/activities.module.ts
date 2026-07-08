import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities';
import { Favorite } from '../favorites/entities';
import { ActivityParticipant } from '../participants/entities';
import { BlockedUser, User } from '../users/entities';
import { ActivitiesController } from './activities.controller';
import { Activity } from './entities';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      Category,
      ActivityParticipant,
      Favorite,
      BlockedUser,
      User,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
