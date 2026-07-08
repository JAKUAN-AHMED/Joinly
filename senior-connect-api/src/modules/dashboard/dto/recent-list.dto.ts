import { IsNumber, IsOptional } from 'class-validator';

export class RecentListDto {
  @IsOptional()
  @IsNumber()
  limit?: number;
}
