import { IsOptional, IsString } from 'class-validator';

export class SubmitUserKycDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
