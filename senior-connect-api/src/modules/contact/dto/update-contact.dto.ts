import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/** Admin — edit the "Contact Us" page (Email / Phone number). Send either or both. */
export class UpdateContactDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}
