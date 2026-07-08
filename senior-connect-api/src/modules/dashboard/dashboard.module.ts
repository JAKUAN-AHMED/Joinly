import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities';
import { Category } from '../categories/entities';
import { ActivityParticipant } from '../participants/entities';
import { User } from '../users/entities';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Activity, ActivityParticipant, Category])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
