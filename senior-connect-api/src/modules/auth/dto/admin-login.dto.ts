import { IsBoolean, IsOptional } from 'class-validator';
import { LoginDto } from './login.dto';

/** Figma "Admin Login" — Email Address, Password, Remember Me */
export class AdminLoginDto extends LoginDto {
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
