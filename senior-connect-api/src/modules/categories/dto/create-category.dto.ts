import { IsString, MaxLength } from 'class-validator';

/** Admin — "Add Category" (Category Name) */
export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  categoryName: string;
}
