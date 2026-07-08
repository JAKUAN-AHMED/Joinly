import { IsEmail } from 'class-validator';

/** Figma "Forget password?" — Enter your email address to reset your password. */
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
