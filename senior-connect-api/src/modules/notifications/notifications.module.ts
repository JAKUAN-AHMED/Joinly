import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities';
import { NotificationsController } from './notifications.controller';
import { Notification, UserNotification } from './entities';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserNotification, User])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
