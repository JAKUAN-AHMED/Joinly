import { IsString } from 'class-validator';

/** Onboarding step 3 of 3 — "Profile Photo" */
export class UpdateProfilePhotoDto {
  @IsString()
  profilePhoto: string;
}
