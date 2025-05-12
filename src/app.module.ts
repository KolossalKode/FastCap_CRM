// src/app.module.ts

import { Module } from '@nestjs/common';
// ConfigModule might be needed if not globally provided elsewhere, but AuthModule provides it globally now.
// import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { ContactsModule } from './contacts/contacts.module';
import { DealsModule } from './deals/deals.module';
import { NotesModule } from './notes/notes.module';
import { AuthModule } from './auth.module'; // Correctly imported
// REMOVE these imports - AuthModule handles them
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';

@Module({
  imports: [
      // ConfigModule.forRoot({ isGlobal: true }), // Not needed if AuthModule does it
      PrismaModule,
      ContactsModule,
      DealsModule,
      NotesModule,
      AuthModule, // Correctly included
  ],
  controllers: [
      AppController // Only AppController belongs here
      // REMOVE AuthController from here
  ],
  providers: [
      AppService // Only AppService belongs here
      // REMOVE AuthService from here
  ],
})
export class AppModule {}
