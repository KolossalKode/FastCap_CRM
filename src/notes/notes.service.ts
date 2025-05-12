// src/notes/notes.service.ts
import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // For generating UUIDs

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  // Create method accepts authorId as a separate parameter
  async create(createNoteDto: CreateNoteDto, authorId: string): Promise<Note> {
    console.log('SERVICE: Create Note DTO:', createNoteDto, 'Author ID:', authorId);
    // Destructure DTO; authorId is now a separate parameter
    const { contactId, dealId, taskId, content } = createNoteDto;
    const newNoteId = uuidv4(); // Generate a new UUID for the note

    try {
      const newNote = await this.prisma.note.create({
        data: {
          id: newNoteId, // Assign the generated ID
          content,
          author: { connect: { id: authorId } }, // Use the passed authorId to connect
          // Conditionally connect to other relations if their IDs are provided
          ...(contactId && { contact: { connect: { id: contactId } } }),
          ...(dealId && { deal: { connect: { id: dealId } } }),
          ...(taskId && { task: { connect: { id: taskId } } }),
        },
        include: { // Include author details in the response for context
            author: { select: { id: true, name: true } }
        }
      });
      console.log('SERVICE: Successfully created note:', newNote.id);
      return newNote;
    } catch (error) {
      console.error("SERVICE: Error creating note:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2025: An operation failed because it depends on one or more records that were required but not found.
        // This can happen if authorId, contactId, dealId, or taskId does not exist.
        if (error.code === 'P2025') {
             throw new BadRequestException(`Could not create note: A related record (Author, Contact, Deal, or Task) was not found.`);
        }
      }
      // Fallback for other errors
      throw new InternalServerErrorException("Could not create note.");
    }
  }

  // Method to find all notes associated with a specific contact
  async findAllByContact(contactId: string): Promise<Note[]> {
    console.log(`SERVICE: findAll Notes for Contact ID: ${contactId}`);
    try {
      return await this.prisma.note.findMany({
        where: { contactId },
        include: { author: { select: { id: true, name: true } } }, // Include author's name and ID
        orderBy: { timestamp: 'desc' }, // Show newest notes first
      });
    } catch (error) {
      console.error(`SERVICE: Error finding notes for contact ${contactId}:`, error);
      throw new InternalServerErrorException("Could not retrieve notes for the contact.");
    }
  }

  // Method to find all notes associated with a specific deal
  async findAllByDeal(dealId: string): Promise<Note[]> {
     console.log(`SERVICE: findAll Notes for Deal ID: ${dealId}`);
    try {
      return await this.prisma.note.findMany({
        where: { dealId },
        include: { author: { select: { id: true, name: true } } }, // Include author's name and ID
        orderBy: { timestamp: 'desc' }, // Show newest notes first
      });
    } catch (error) {
      console.error(`SERVICE: Error finding notes for deal ${dealId}:`, error);
      throw new InternalServerErrorException("Could not retrieve notes for the deal.");
    }
  }

  // TODO: Implement findAllByTask similarly when Task module exists
  // async findAllByTask(taskId: string): Promise<Note[]> { ... }

  // TODO: Implement findAllByAuthor if needed
  // async findAllByAuthor(authorId: string): Promise<Note[]> { ... }

  // Method to update the content of an existing note
  async update(id: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
    console.log(`SERVICE: update Note ID: ${id}`, updateNoteDto);
    const { content } = updateNoteDto; // Only content is updatable as per UpdateNoteDto

    // If content is not provided in the DTO, it means no update to content is requested.
    // We can either throw an error or return the existing note.
    // For this example, we'll return the existing note if content is undefined.
    if (content === undefined) {
         console.warn(`SERVICE: Update Note called for ID ${id} with no content to update.`);
         const existingNote = await this.prisma.note.findUnique({
            where: { id },
            include: { author: { select: { id: true, name: true } } }
         });
         if (!existingNote) {
             throw new NotFoundException(`Note with ID "${id}" not found.`);
         }
         return existingNote;
    }

    try {
      return await this.prisma.note.update({
        where: { id },
        data: { content }, // Only update the content field
         include: { author: { select: { id: true, name: true } } } // Include author for context
      });
    } catch (error) {
      console.error(`SERVICE: Error updating note ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // P2025: Record to update not found
        throw new NotFoundException(`Note with ID "${id}" not found for update.`);
      }
      throw new InternalServerErrorException("Could not update note.");
    }
  }

  // Method to remove a note by its ID
  async remove(id: string): Promise<Note> {
    console.log(`SERVICE: remove Note: ${id}`);
    try {
      return await this.prisma.note.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`SERVICE: Error deleting note ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // P2025: Record to delete not found
        throw new NotFoundException(`Note with ID "${id}" not found for deletion`);
      }
      throw new InternalServerErrorException("Could not delete note.");
    }
  }
}
