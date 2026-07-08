import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/** Figma "Discover" + "Apply Filter" sheet */
export class DiscoverActivitiesDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  /** "Search activities near you…" */
  @IsOptional()
  @IsString()
  search?: string;

  /** "Choose activity categories" */
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** "Activity date & time" */
  @IsOptional()
  @IsDateString()
  activityDate?: string;

  /** "Participate age range" */
  @IsOptional()
  @IsInt()
  minAge?: number;

  @IsOptional()
  @IsInt()
  maxAge?: number;

  /** "Activity distances" (km) — requires latitude/longitude */
  @IsOptional()
  @IsNumber()
  maxDistance?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  /** "Map view | List view" */
  @IsOptional()
  @IsIn(['map', 'list'])
  view?: 'map' | 'list';
}
