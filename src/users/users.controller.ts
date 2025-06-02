import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // @HttpCode(201) // NestJS defaults to 201 for POST
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // It's good practice to validate that 'id' is a UUID if your DB uses UUIDs for IDs.
    // PrismaService and the DB will handle non-UUIDs if 'id' is not a UUID,
    // but ParseUUIDPipe provides a cleaner request validation.
    // If your ID is not a UUID (e.g. CUID or auto-increment int), remove ParseUUIDPipe
    // or use a different validation pipe.
    // Based on schema.prisma, id is a String, often a UUID in such setups.
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  // @HttpCode(204) // To return 204 No Content, the method should ideally return void or null/undefined.
  // Since usersService.remove returns an object { message: ... }, 200 is the default and appropriate.
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
