import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities';
import { Category } from '../categories/entities';
import { ActivityParticipant } from '../participants/entities';
import { UsersController } from './users.controller';
import { BlockedUser, User, UserInterest } from './entities';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserInterest,
      BlockedUser,
      Category,
      Activity,
      ActivityParticipant,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
