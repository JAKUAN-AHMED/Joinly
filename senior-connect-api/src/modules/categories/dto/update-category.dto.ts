import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryStatus } from '../../../common/enums';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryName?: string;

  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;
}
