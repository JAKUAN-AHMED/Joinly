import { IsNumber, IsOptional } from 'class-validator';

export class ListParticipantsDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
