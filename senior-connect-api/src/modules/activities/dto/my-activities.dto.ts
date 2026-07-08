import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ActivityTab } from '../../../common/enums';

/** Tabs: All Activities | Upcoming Activities | Past Activities */
export class MyActivitiesDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(ActivityTab)
  tab?: ActivityTab;
}
