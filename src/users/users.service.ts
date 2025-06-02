import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Assuming prisma.service.ts is in src/
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;
    if (!password) { // Defensive check, though DTO should enforce it
        throw new InternalServerErrorException('Password is required');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = uuidv4(); // Generate UUID for the new user

    try {
        const user = await this.prisma.user.create({
          data: {
            id: newUserId, // Assign generated ID
            email,
            name,
            password: hashedPassword,
          },
          // Exclude password from the returned object
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        return user;
      } catch (error) {
        if (error.code === 'P2002') { // Prisma unique constraint violation
          throw new ConflictException('Email already exists');
        }
        throw new InternalServerErrorException('Could not create user');
      }
    }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        // Exclude password from the returned objects
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Could not retrieve users');
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      // Exclude password from the returned object
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...dataToUpdate } = updateUserDto;
    let hashedPassword: string | undefined = undefined;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...dataToUpdate,
          ...(hashedPassword && { password: hashedPassword }), // Spread password only if it's being updated
        },
        // Exclude password from the returned object
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (error) {
      if (error.code === 'P2025') { // Prisma record to update not found
        throw new NotFoundException(`User with ID "${id}" not found`);
      } else if (error.code === 'P2002') { // Prisma unique constraint violation (e.g. if email is updated to an existing one)
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Could not update user');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({
        where: { id },
        // Exclude password from the returned object (though delete returns the deleted object)
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      // Return a success message or status, as the object is deleted
      return { message: `User with ID "${id}" successfully deleted` };
    } catch (error) {
      if (error.code === 'P2025') { // Prisma record to delete not found
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
      throw new InternalServerErrorException('Could not delete user');
    }
  }
}
