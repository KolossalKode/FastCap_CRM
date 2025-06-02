// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { ContactsModule } from './contacts/contacts.module';
import { DealsModule } from './deals/deals.module';
import { NotesModule } from './notes/notes.module';
import { AuthModule } from './auth.module';
import { TasksModule } from './tasks/tasks.module'; // <-- Import TasksModule
import { SubmissionsModule } from './submissions/submissions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
      PrismaModule,
      ContactsModule,
      DealsModule,
      NotesModule,
      AuthModule,
      TasksModule, // <-- Add TasksModule here
      SubmissionsModule,
      UsersModule,
  ],
  controllers: [
      AppController
  ],
  providers: [
      AppService
  ],
})
export class AppModule {}
