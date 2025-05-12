        // src/contacts/dto/create-contact.dto.ts
        import {
            IsString,
            IsEmail,
            IsOptional,
            IsNotEmpty,
            IsArray,
            IsUUID,
            MaxLength,
            MinLength,
          } from 'class-validator';
  
          export class CreateContactDto {
            @IsString()
            @IsNotEmpty()
            @MinLength(1)
            firstName: string;
  
            @IsString()
            @IsNotEmpty()
            @MinLength(1)
            lastName: string;
  
            @IsEmail()
            @IsNotEmpty()
            email: string;
  
            @IsString()
            @IsOptional()
            phone?: string; // Main phone
  
            @IsString()
            @IsOptional()
            mobilePhone?: string;
  
            @IsString()
            @IsOptional()
            officePhone?: string;
  
            @IsString()
            @IsOptional()
            otherPhone?: string;
  
            @IsString()
            @IsOptional()
            company?: string;
  
            // For tags, expect an array of strings. Frontend might send comma-separated.
            // The service logic currently handles comma-separated strings,
            // but ideally, the frontend sends a proper array.
            // If tags are sent as a string, the ValidationPipe might fail unless transformed earlier.
            // For now, we mark it optional and let the service handle transformation.
            @IsArray()
            @IsString({ each: true }) // Validates each element in the array is a string
            @IsOptional()
            tags?: string[];
  
            @IsString()
            @IsOptional()
            lead_status?: string = 'New'; // Default handled by Prisma, but good to have here
  
            @IsString()
            @IsOptional()
            contactType?: string = 'Primary'; // Default handled by Prisma
  
            @IsString()
            @IsOptional()
            businessAddress?: string;
  
            @IsString()
            @IsOptional()
            businessCity?: string;
  
            @IsString()
            @IsOptional()
            businessZip?: string;
  
            // ownerId should be a valid UUID if provided
            @IsUUID()
            @IsOptional()
            ownerId?: string | null; // Allow null as well
          }
          