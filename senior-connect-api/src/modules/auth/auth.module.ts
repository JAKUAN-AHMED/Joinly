import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from '../../common/services/mail.service';
import { User } from '../users/entities';
import { AuthController } from './auth.controller';
import { Otp } from './entities';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Otp])],
  controllers: [AuthController],
  providers: [AuthService, MailService],
})
export class AuthModule {}
