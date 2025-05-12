// src/contacts/contacts.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, BadRequestException } from '@nestjs/common'; // Make sure UseGuards is imported
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // <-- Import the guard

@UseGuards(JwtAuthGuard) // <-- Apply the guard to the whole controller
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    console.log('CONTROLLER: Create Contact DTO received:', createContactDto);
    return this.contactsService.create(createContactDto);
  }

  @Get()
  findAll(@Query('search') searchTerm?: string) {
    console.log('CONTROLLER: Search Term:', searchTerm);
    if (searchTerm) {
        return this.contactsService.search(searchTerm);
    }
    return this.contactsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    console.log('CONTROLLER: Updating Contact ID:', id, 'with DTO:', updateContactDto);
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
