import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OtpType } from '../../../common/enums';

/** "Didn't get the code?" */
export class ResendOtpDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(OtpType)
  type?: OtpType;
}
