// src/tasks/tasks.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request, // To access the authenticated user
    Query,   // For potential query parameters later
    ParseUUIDPipe, // For validating UUIDs in parameters
  } from '@nestjs/common';
  import { TasksService } from './tasks.service';
  import { CreateTaskDto } from './dto/create-task.dto';
  import { UpdateTaskDto } from './dto/update-task.dto';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path if needed
  
  @UseGuards(JwtAuthGuard) // Protect all routes in this controller
  @Controller('tasks') // Base route for this controller will be /tasks
  export class TasksController {
    constructor(private readonly tasksService: TasksService) {}
  
    /**
     * Creates a new task.
     * The creator of the task is the authenticated user.
     */
    @Post()
    create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
      // req.user is populated by JwtStrategy after validating the token
      // Ensure req.user and req.user.id exist before accessing
      if (!req.user || !req.user.id) {
          throw new Error('User ID not found in request. Ensure JWT strategy populates req.user.id.');
      }
      const creatorId = req.user.id; // Get user ID from the validated token payload
      console.log(`CONTROLLER: User ${creatorId} creating task:`, createTaskDto);
      return this.tasksService.create(createTaskDto, creatorId);
    }
  
    /**
     * Retrieves all tasks.
     * TODO: Implement filtering (by assignee, status, due date range, etc.) and pagination using a DTO for queryParams.
     */
    @Get()
    findAll(/* @Query() queryParams: FindAllTasksDto */) { // Consider a DTO for query params
      console.log('CONTROLLER: findAll tasks');
      return this.tasksService.findAll();
    }
  
    /**
     * Retrieves a specific task by its ID.
     * Uses ParseUUIDPipe to validate that 'id' is a UUID.
     */
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) { // Added ParseUUIDPipe
      console.log(`CONTROLLER: findOne task with id: ${id}`);
      return this.tasksService.findOne(id);
    }
  
    /**
     * Updates an existing task.
     * Uses ParseUUIDPipe to validate that 'id' is a UUID.
     * TODO: Add authorization: only assigned user or admin/owner should update.
     */
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req: any) { // Added ParseUUIDPipe
      if (!req.user || !req.user.id) {
          throw new Error('User ID not found in request.');
      }
      console.log(`CONTROLLER: User ${req.user.id} updating task ${id} with:`, updateTaskDto);
      return this.tasksService.update(id, updateTaskDto);
    }
  
    /**
     * Deletes a task.
     * Uses ParseUUIDPipe to validate that 'id' is a UUID.
     * TODO: Add authorization: only assigned user or admin/owner should delete.
     */
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) { // Added ParseUUIDPipe
      if (!req.user || !req.user.id) {
          throw new Error('User ID not found in request.');
      }
      console.log(`CONTROLLER: User ${req.user.id} deleting task ${id}`);
      return this.tasksService.remove(id);
    }
  }
  