import { IsBoolean, IsOptional, IsString } from 'class-validator';

/** "App Preferences" screen */
export class UpdateAppPreferencesDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsBoolean()
  notificationSounds?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNotifications?: boolean;
}
