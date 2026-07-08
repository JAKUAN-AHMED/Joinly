import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { OtpType } from '../../../common/enums';

/** Figma "OTP verification" — We've sent a verification code to your email. */
export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'otpCode must be a 6 digit code' })
  otpCode: string;

  @IsOptional()
  @IsEnum(OtpType)
  type?: OtpType;
}
