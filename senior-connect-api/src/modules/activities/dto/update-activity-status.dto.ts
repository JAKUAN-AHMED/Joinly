import { IsIn, IsOptional, IsString } from 'class-validator';
import { ActivityStatus } from '../../../common/enums';

/** Admin — Approve / Reject */
export class UpdateActivityStatusDto {
  @IsIn([ActivityStatus.Approved, ActivityStatus.Rejected])
  status: ActivityStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
