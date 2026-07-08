import { IsEmail, IsString } from 'class-validator';

/** Figma "Welcome Back — Sign in to access your account" */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
