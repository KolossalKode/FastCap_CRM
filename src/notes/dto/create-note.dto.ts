        // src/notes/dto/create-note.dto.ts
        import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

        export class CreateNoteDto {
          @IsString()
          @IsNotEmpty()
          content: string;

          // The author (User ID) is required to create a note
          @IsString()
          @IsNotEmpty()
          authorId: string; // Assuming CUID from Prisma

          // A note should relate to at least one other entity,
          // but making them optional here allows flexibility.
          // Consider adding custom validation later to ensure at least one is provided.
          @IsString()
          @IsNotEmpty()
          @IsOptional()
          contactId?: string; // Assuming CUID from Prisma

          @IsString()
          @IsNotEmpty()
          @IsOptional()
          dealId?: string; // Assuming CUID from Prisma

          @IsString()
          @IsNotEmpty()
          @IsOptional()
          taskId?: string; // Assuming CUID from Prisma
        }
        