import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities';
import { User } from '../users/entities';
import { ParticipantsController } from './participants.controller';
import { ActivityParticipant } from './entities';
import { ParticipantsService } from './participants.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityParticipant, Activity, User])],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
})
export class ParticipantsModule {}
