    // src/tasks/dto/create-task.dto.ts
    import {
        IsString,
        IsOptional,
        IsNotEmpty,
        IsDateString,
        // IsUUID, // We'll use IsString for CUIDs/UUIDs from other entities
      } from 'class-validator';
  
      export class CreateTaskDto {
        @IsString()
        @IsNotEmpty()
        title: string;
  
        @IsString()
        @IsOptional()
        description?: string;
  
        @IsDateString()
        @IsOptional()
        dueDate?: string; // Expects ISO 8601 date string
  
        @IsString()
        @IsOptional()
        status?: string = 'Pending'; // Default can also be set in service if not provided
  
        @IsString()
        @IsOptional()
        priority?: string; // e.g., High, Medium, Low
  
        // The ID of the user this task is assigned to.
        // This will come from the request body.
        // The creator of the task will be the logged-in user (from JWT).
        @IsString()
        @IsNotEmpty() // Assuming a task should be assigned when created, adjust if optional
        @IsOptional() // Making it optional for now, service can default to creator
        assignedToId?: string;
  
        // Optional IDs for linking to a Contact or Deal
        @IsString()
        @IsNotEmpty()
        @IsOptional()
        contactId?: string;
  
        @IsString()
        @IsNotEmpty()
        @IsOptional()
        dealId?: string;
      }
      