import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  lender_name: string;

  @IsDateString()
  @IsOptional()
  submission_date?: string;

  @IsString()
  @IsOptional()
  status?: string = 'Submitted';

  @IsDateString()
  @IsOptional()
  approval_date?: string;

  @IsNumber()
  @IsOptional()
  approval_amount?: number;

  @IsString()
  @IsOptional()
  approval_term?: string;

  @IsNumber()
  @IsOptional()
  approval_rate?: number;

  @IsString()
  @IsOptional()
  stipulations?: string;

  @IsString()
  @IsOptional()
  approval_link?: string;

  @IsString()
  @IsOptional()
  decline_reason?: string;

  @IsString()
  @IsNotEmpty()
  dealId: string;
}
