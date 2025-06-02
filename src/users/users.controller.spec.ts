import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConflictException, NotFoundException, ParseUUIDPipe } from '@nestjs/common';

// Mock UsersService
const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockUserOutput = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: typeof mockUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
    // .overridePipe(ParseUUIDPipe) // We could mock/override pipes if needed for specific tests
    // .useValue({ transform: jest.fn(value => value) }) // but for basic unit tests, it's often not necessary
    .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should call usersService.create and return the result', async () => {
      service.create.mockResolvedValue(mockUserOutput);
      const result = await controller.create(createUserDto);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUserOutput);
    });

    it('should propagate ConflictException from usersService.create', async () => {
      service.create.mockRejectedValue(new ConflictException('Email conflict'));
      await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return the result', async () => {
      const usersArray = [mockUserOutput, { ...mockUserOutput, id: 'user-uuid-2' }];
      service.findAll.mockResolvedValue(usersArray);
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(usersArray);
    });
  });

  describe('findOne', () => {
    const userId = 'user-uuid-1';

    it('should call usersService.findOne and return the result', async () => {
      service.findOne.mockResolvedValue(mockUserOutput);
      const result = await controller.findOne(userId);
      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserOutput);
    });

    it('should propagate NotFoundException from usersService.findOne', async () => {
      service.findOne.mockRejectedValue(new NotFoundException('User not found'));
      await expect(controller.findOne(userId)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    const userId = 'user-uuid-1';
    const updateUserDto: UpdateUserDto = { name: 'Updated Name' };

    it('should call usersService.update and return the result', async () => {
      const updatedUser = { ...mockUserOutput, ...updateUserDto };
      service.update.mockResolvedValue(updatedUser);
      const result = await controller.update(userId, updateUserDto);
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should propagate NotFoundException from usersService.update', async () => {
      service.update.mockRejectedValue(new NotFoundException('User not found for update'));
      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
    });
    
    it('should propagate ConflictException from usersService.update', async () => {
      service.update.mockRejectedValue(new ConflictException('Email conflict on update'));
      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
    });
  });

  describe('remove', () => {
    const userId = 'user-uuid-1';
    const successMessage = { message: `User with ID "${userId}" successfully deleted` };


    it('should call usersService.remove and return the result', async () => {
      service.remove.mockResolvedValue(successMessage);
      const result = await controller.remove(userId);
      expect(service.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual(successMessage);
    });

    it('should propagate NotFoundException from usersService.remove', async () => {
      service.remove.mockRejectedValue(new NotFoundException('User not found for deletion'));
      await expect(controller.remove(userId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(userId);
    });
  });
});
