import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationAudience } from '../../../common/enums';

/** Figma "Compose Notification" — Notification Title, Message Content, audience */
export class ComposeNotificationDto {
  @IsString()
  @MaxLength(200)
  notificationTitle: string;

  @IsString()
  messageContent: string;

  @IsOptional()
  @IsEnum(NotificationAudience)
  audience?: NotificationAudience;
}
