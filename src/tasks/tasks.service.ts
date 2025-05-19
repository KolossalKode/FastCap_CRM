// src/tasks/tasks.service.ts
import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, creatorId: string): Promise<Task> {
    console.log('SERVICE: Create Task DTO:', createTaskDto, 'Creator ID:', creatorId);
    const { title, description, dueDate, status, priority, assignedToId, contactId, dealId } = createTaskDto;
    const newTaskId = uuidv4();

    const finalAssignedToId = assignedToId || creatorId;

    const dataForCreate: Prisma.TaskCreateInput = {
      id: newTaskId,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'Pending',
      priority,
      ...(finalAssignedToId && { assignedUser: { connect: { id: finalAssignedToId } } }),
      ...(contactId && { contact: { connect: { id: contactId } } }),
      ...(dealId && { deal: { connect: { id: dealId } } }),
    };

    try {
      const newTask = await this.prisma.task.create({
        data: dataForCreate,
        include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
            deal: { select: { id: true, name: true } },
        }
      });
      console.log('SERVICE: Successfully created task:', newTask.id);
      return newTask;
    } catch (error) {
      console.error("SERVICE: Error creating task:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException(`Could not create task: A related record (Assignee, Contact, or Deal) was not found.`);
        }
      }
      throw new InternalServerErrorException("Could not create task.");
    }
  }

  async findAll(): Promise<Task[]> {
    console.log('SERVICE: findAll Tasks');
    try {
      return await this.prisma.task.findMany({
        include: {
            assignedUser: { select: { id: true, name: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
            deal: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error("SERVICE: Error finding all tasks:", error);
      throw new InternalServerErrorException("Could not retrieve tasks.");
    }
  }

  // Ensure findOne returns Promise<Task> and throws if not found
  async findOne(id: string): Promise<Task> {
    console.log(`SERVICE: findOne Task: ${id}`);
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            contact: true,
            deal: true,
            notes: { orderBy: { timestamp: 'desc' } },
        },
      });
      if (!task) {
        // If task is not found, throw NotFoundException.
        // This ensures the promise either resolves with a Task or rejects.
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }
      return task; // task is guaranteed to be non-null here
    } catch (error) {
      console.error(`SERVICE: Error finding task ${id}:`, error);
      // Re-throw NotFoundException if it's already that type
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Otherwise, wrap in a generic server error
      throw new InternalServerErrorException("Could not retrieve task.");
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    console.log(`SERVICE: update Task ID: ${id}`, updateTaskDto);

    const dataToUpdate: Prisma.TaskUpdateInput = {};
    if (updateTaskDto.title !== undefined) dataToUpdate.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) dataToUpdate.description = updateTaskDto.description;
    if (updateTaskDto.dueDate !== undefined) dataToUpdate.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    if (updateTaskDto.status !== undefined) dataToUpdate.status = updateTaskDto.status;
    if (updateTaskDto.priority !== undefined) dataToUpdate.priority = updateTaskDto.priority;

    if (updateTaskDto.hasOwnProperty('assignedToId')) {
        dataToUpdate.assignedUser = updateTaskDto.assignedToId
            ? { connect: { id: updateTaskDto.assignedToId } }
            : { disconnect: true };
    }
    if (updateTaskDto.hasOwnProperty('contactId')) {
        dataToUpdate.contact = updateTaskDto.contactId
            ? { connect: { id: updateTaskDto.contactId } }
            : { disconnect: true };
    }
    if (updateTaskDto.hasOwnProperty('dealId')) {
        dataToUpdate.deal = updateTaskDto.dealId
            ? { connect: { id: updateTaskDto.dealId } }
            : { disconnect: true };
    }

    if (Object.keys(dataToUpdate).length === 0) {
        console.warn(`SERVICE: Update Task called for ID ${id} with no data to update.`);
        // Since findOne now returns Promise<Task> (or throws),
        // existingTask will be of type Task if findOne completes without error.
        const existingTask = await this.findOne(id);
        return existingTask; // This line (134 in your error) should now be type-safe.
    }

    try {
      return await this.prisma.task.update({
        where: { id },
        data: dataToUpdate,
        include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
            deal: { select: { id: true, name: true } },
        }
      });
    } catch (error) {
      console.error(`SERVICE: Error updating task ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Task with ID "${id}" or a related record (Assignee, Contact, Deal) not found for update.`);
        }
      }
      throw new InternalServerErrorException("Could not update task.");
    }
  }

  async remove(id: string): Promise<Task> {
    console.log(`SERVICE: remove Task: ${id}`);
    try {
      return await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`SERVICE: Error deleting task ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Task with ID "${id}" not found for deletion`);
      }
      throw new InternalServerErrorException("Could not delete task.");
    }
  }
}
