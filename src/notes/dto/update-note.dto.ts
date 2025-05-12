        // src/notes/dto/update-note.dto.ts
        import { PartialType } from '@nestjs/mapped-types';
        import { IsString, IsNotEmpty } from 'class-validator';

        // Define a base DTO with only the updatable field(s)
        class UpdateNoteBaseDto {
            @IsString()
            @IsNotEmpty()
            content: string;
        }

        // Use PartialType to make 'content' optional for PATCH requests.
        // We don't typically allow changing the author or relations of a note after creation.
        export class UpdateNoteDto extends PartialType(UpdateNoteBaseDto) {}
        