import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CategoryStatus } from '../../../common/enums';

export class AdminListCategoriesDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}
