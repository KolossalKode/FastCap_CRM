import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

// Mock PrismaService
const mockPrismaService = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockUser = {
  id: 'some-uuid',
  email: 'test@example.com',
  name: 'Test User',
  role: 'User',
  password: 'hashedPassword', // This won't be returned by service methods
  createdAt: new Date(),
  updatedAt: new Date(),
};

const userOutput = { // What service methods should return (no password)
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    role: mockUser.role,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
};


describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };
    const hashedPassword = 'hashedPassword123';

    it('should successfully create a user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.create.mockResolvedValue(userOutput);

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
        },
        select: {
            id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
        },
      });
      expect(result).toEqual(userOutput);
    });

    it('should throw ConflictException if email already exists (Prisma P2002 error)', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
    
    it('should throw InternalServerErrorException for other errors during creation', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.create.mockRejectedValue(new Error('Some other error')); // Generic error
      
      await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const usersArray = [userOutput, { ...userOutput, id: 'uuid-2', email: 'test2@example.com' }];
      prisma.user.findMany.mockResolvedValue(usersArray);

      const result = await service.findAll();
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
            id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
        },
      });
      expect(result).toEqual(usersArray);
    });

    it('should throw InternalServerErrorException if findMany fails', async () => {
        prisma.user.findMany.mockRejectedValue(new Error('DB error'));
        await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    const userId = 'some-uuid';

    it('should return a user object if found', async () => {
      prisma.user.findUnique.mockResolvedValue(userOutput);

      const result = await service.findOne(userId);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
            id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
        },
      });
      expect(result).toEqual(userOutput);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = 'some-uuid';
    const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
    const updateUserDtoWithPass: UpdateUserDto = { name: 'Updated Name', password: 'newPassword123' };
    const hashedPassword = 'newHashedPassword123';

    it('should successfully update a user (without password)', async () => {
      const updatedUser = { ...userOutput, name: updateUserDto.name };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);
      
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name: updateUserDto.name },
        select: {
            id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should successfully update a user (with password)', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      const updatedUser = { ...userOutput, name: updateUserDtoWithPass.name };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDtoWithPass);

      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDtoWithPass.password, 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          name: updateUserDtoWithPass.name,
          password: hashedPassword,
        },
        select: {
            id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user to update not found (Prisma P2025 error)', async () => {
      prisma.user.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email conflict on update (Prisma P2002 error)', async () => {
      prisma.user.update.mockRejectedValue({ code: 'P2002' });
      const dtoWithEmail: UpdateUserDto = { email: 'new@example.com' };
      await expect(service.update(userId, dtoWithEmail)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException for other errors during update', async () => {
        prisma.user.update.mockRejectedValue(new Error('Some other error'));
        await expect(service.update(userId, updateUserDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    const userId = 'some-uuid';

    it('should successfully delete a user and return a success message', async () => {
      // prisma.user.delete is mocked to return the deleted user object by the service,
      // but the service method itself transforms this into a success message.
      prisma.user.delete.mockResolvedValue(userOutput); 

      const result = await service.remove(userId);
      
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
        select: { // This select is in the service, good to verify it's called
            id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
        }
      });
      expect(result).toEqual({ message: `User with ID "${userId}" successfully deleted` });
    });

    it('should throw NotFoundException if user to delete not found (Prisma P2025 error)', async () => {
      prisma.user.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors during deletion', async () => {
        prisma.user.delete.mockRejectedValue(new Error('Some other error'));
        await expect(service.remove(userId)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
