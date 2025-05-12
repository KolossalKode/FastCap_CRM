// src/prisma.service.ts
import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Connect to the database when the module is initialized.
    // Prisma Client automatically connects lazily, but explicit connect
    // can help catch connection issues early.
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Ensure Prisma disconnects gracefully on application shutdown.
    // Listens for the 'beforeExit' event
     process.on('beforeExit', async () => {
       await app.close();
     });
  }
}