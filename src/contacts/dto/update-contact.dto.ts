        // src/contacts/dto/update-contact.dto.ts
        import { PartialType } from '@nestjs/mapped-types';
        import { CreateContactDto } from './create-contact.dto';

        // PartialType makes all properties from CreateContactDto optional.
        // This is perfect for PATCH requests where only some fields might be sent.
        export class UpdateContactDto extends PartialType(CreateContactDto) {}
        