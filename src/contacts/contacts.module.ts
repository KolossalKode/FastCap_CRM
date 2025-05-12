        // src/contacts/contacts.module.ts
        import { Module } from '@nestjs/common';
        import { ContactsService } from './contacts.service';
        import { ContactsController } from './contacts.controller'; // Ensure './contacts.controller.ts' exists

        @Module({
          imports: [],
          controllers: [ContactsController],
          providers: [ContactsService],
        })
        export class ContactsModule {}
        