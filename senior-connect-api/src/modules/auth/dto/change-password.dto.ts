import { IsString, Length } from 'class-validator';

/** Figma "Change Password" — Current Password, Create New Password, Confirm Password */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Length(6, 8, { message: 'Password must have 6-8 characters.' })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
