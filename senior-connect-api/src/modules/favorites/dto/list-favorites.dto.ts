import { IsNumber, IsOptional } from 'class-validator';

export class ListFavoritesDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
