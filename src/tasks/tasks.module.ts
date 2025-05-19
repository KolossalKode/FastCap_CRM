// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
// PrismaModule is Global, so no need to import it here explicitly

@Module({
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
