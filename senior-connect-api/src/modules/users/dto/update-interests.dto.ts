import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/** Onboarding step 2 of 3 — "Choose Interests" (Select at least 3 interests.) */
export class UpdateInterestsDto {
  @IsArray()
  @ArrayMinSize(3, { message: 'Select at least 3 interests.' })
  @IsUUID('4', { each: true })
  categoryIds: string[];
}
