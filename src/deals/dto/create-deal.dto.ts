    // src/deals/dto/create-deal.dto.ts
    import {
      IsString,
      IsOptional,
      IsNotEmpty,
      IsNumber,
      IsDateString,
      // IsUUID, // No longer needed for contactIds if using CUIDs
      IsArray,
      ValidateNested,
    } from 'class-validator';
    import { Type } from 'class-transformer';

    export class CreateDealDto {
      @IsString()
      @IsNotEmpty()
      name: string;

      @IsNumber()
      @IsOptional()
      value?: number;

      @IsString()
      @IsNotEmpty()
      stage: string;

      @IsDateString()
      @IsOptional()
      expectedCloseDate?: string;

      @IsString()
      @IsOptional()
      dealType?: string;

      @IsString()
      @IsOptional()
      priority?: string;

      @IsString()
      @IsOptional()
      nextStep?: string;

      // TODO: Add ownerId validation if needed (IsString, IsNotEmpty, IsOptional)

      // Use IsString and IsNotEmpty for CUIDs from Prisma
      @IsArray()
      @IsString({ each: true }) // Ensure each element is a string
      @IsNotEmpty({ each: true }) // Ensure each string is not empty
      @IsOptional()
      contactIds?: string[];
    }
    