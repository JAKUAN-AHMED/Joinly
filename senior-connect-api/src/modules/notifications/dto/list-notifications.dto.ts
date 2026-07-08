import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { NotificationAudience, NotificationStatus } from '../../../common/enums';

export class ListNotificationsDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(NotificationAudience)
  audience?: NotificationAudience;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}
