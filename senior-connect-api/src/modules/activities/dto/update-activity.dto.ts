import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMilitaryTime,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Difficulty } from '../../../common/enums';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  activityName?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  descriptions?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maximumNumberOfParticipants?: number;

  @IsOptional()
  @IsString()
  activityPhoto?: string;

  @IsOptional()
  @IsDateString()
  activityDate?: string;

  @IsOptional()
  @IsMilitaryTime()
  activityTime?: string;

  @IsOptional()
  @IsString()
  activityDuration?: string;

  @IsOptional()
  @IsString()
  activityEquipment?: string;

  @IsOptional()
  @IsString()
  activityLocation?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Max(120)
  maxAge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  /** Submit a Draft for approval */
  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
