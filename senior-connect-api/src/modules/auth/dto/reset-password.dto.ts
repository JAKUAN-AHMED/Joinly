import { IsEmail, IsString, Length, Matches } from 'class-validator';

/** Figma "Reset Password" — Password must have 6-8 characters. */
export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'otpCode must be a 6 digit code' })
  otpCode: string;

  @IsString()
  @Length(6, 8, { message: 'Password must have 6-8 characters.' })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
