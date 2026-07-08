import { IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../../common/enums';

/** Admin users list — search / filter / tabs */
export class AdminListUsersDto {
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
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsIn(['All Users', 'Active Users', 'Blocked Users'])
  tab?: string;
}
