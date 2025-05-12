// src/notes/notes.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ensure path is correct

@UseGuards(JwtAuthGuard) // Apply guard
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @Request() req: any) { // Typed req as any
    // req.user is populated by JwtStrategy after validating the token
    // Ensure req.user and req.user.id exist before accessing
    if (!req.user || !req.user.id) {
        throw new Error('User ID not found in request. Ensure JWT strategy populates req.user.id.');
    }
    const authorId = req.user.id; // Get user ID from the validated token payload
    console.log(`CONTROLLER: Creating note for authorId: ${authorId}`);
    // Pass authorId along with the rest of the DTO to the service
    return this.notesService.create(createNoteDto, authorId);
  }

  @Get('contact/:contactId')
  findAllByContact(@Param('contactId') contactId: string) {
    return this.notesService.findAllByContact(contactId);
  }

  @Get('deal/:dealId')
  findAllByDeal(@Param('dealId') dealId: string) {
    return this.notesService.findAllByDeal(dealId);
  }

  // TODO: Add route for tasks: GET /notes/task/:taskId

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto, @Request() req: any) { // Typed req as any
    // TODO: Add authorization check - does req.user own this note or have permission?
    if (!req.user || !req.user.id) {
        throw new Error('User ID not found in request.');
    }
    console.log(`CONTROLLER: User ${req.user.id} attempting to update note ${id}`);
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) { // Typed req as any
     // TODO: Add authorization check - does req.user own this note or have permission?
    if (!req.user || !req.user.id) {
        throw new Error('User ID not found in request.');
    }
    console.log(`CONTROLLER: User ${req.user.id} attempting to delete note ${id}`);
    return this.notesService.remove(id);
  }
}
