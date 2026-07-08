import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities';
import { ActivityParticipant } from '../participants/entities';
import { FavoritesController } from './favorites.controller';
import { Favorite } from './entities';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Activity, ActivityParticipant])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
