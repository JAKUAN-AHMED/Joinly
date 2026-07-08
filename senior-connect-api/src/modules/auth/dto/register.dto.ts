import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

/** Figma "Create Account" — Place all the information to create account */
export class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 8, { message: 'Password must have 6-8 characters.' })
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  language?: string;

  /** "By creating an account, I accept the Terms & Conditions & Privacy Policy." */
  @IsBoolean()
  @Equals(true, { message: 'You must accept the Terms & Conditions & Privacy Policy.' })
  acceptTerms: boolean;
}
