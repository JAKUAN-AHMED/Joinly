import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../common/enums';

/** Admin — change account status ("Block user") */
export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
