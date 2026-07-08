import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/** Onboarding step 1 of 3 — "Your location" (Enable Location / Enter Location Manually) */
export class UpdateLocationDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
