    // src/notes/notes.module.ts
    import { Module } from '@nestjs/common';
    import { NotesService } from './notes.service';
    import { NotesController } from './notes.controller';

    @Module({
      controllers: [NotesController],
      providers: [NotesService],
      // No need to import PrismaModule if it's Global
    })
    export class NotesModule {}
    