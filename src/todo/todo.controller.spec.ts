import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Reflector } from '@nestjs/core';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtUser } from '../auth/decorators/current-user.decorator';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { PoliciesGuard } from '../auth/guards/policies.guard';

const mockUserId = new Types.ObjectId().toHexString();
const mockTodoId = new Types.ObjectId().toHexString();

const mockJwtUser: JwtUser = {
  userId: mockUserId,
  email: 'test@example.com',
  role: 'user',
};

const mockTodo = {
  _id: mockTodoId,
  title: 'Learn Testing',
  description: 'Write unit tests',
  completed: false,
  userId: new Types.ObjectId(mockUserId),
};

const mockTodoService = {
  findAll: jest.fn().mockResolvedValue([mockTodo]),
  findOne: jest.fn().mockResolvedValue(mockTodo),
  create: jest.fn().mockResolvedValue(mockTodo),
  update: jest.fn().mockResolvedValue({ ...mockTodo, completed: true }),
  remove: jest.fn().mockResolvedValue(undefined),
};

const mockCaslAbilityFactory = {
  defineAbilityFor: jest.fn().mockReturnValue({
    can: jest.fn().mockReturnValue(true),
  }),
};

describe('TodoController', () => {
  let controller: TodoController;
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        {
          provide: TodoService,
          useValue: mockTodoService,
        },
        {
          provide: CaslAbilityFactory,
          useValue: mockCaslAbilityFactory,
        },
        {
          provide: PoliciesGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<TodoController>(TodoController);
    service = module.get<TodoService>(TodoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll and return todos', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockTodo]);
      expect(service.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = await controller.findOne(mockTodoId);
      expect(result).toEqual(mockTodo);
      expect(service.findOne).toHaveBeenCalledWith(mockTodoId);
    });

    it('should propagate NotFoundException from the service', async () => {
      (service.findOne as jest.Mock).mockRejectedValueOnce(
        new NotFoundException(`Todo with id 'bad-id' not found`),
      );
      await expect(controller.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should call service.create with DTO and userId', async () => {
      const dto: CreateTodoDto = {
        title: 'New Todo',
        description: 'From test',
      };
      const result = await controller.create(dto, mockJwtUser);
      expect(result).toEqual(mockTodo);
      expect(service.create).toHaveBeenCalledWith(dto, mockUserId);
    });
  });

  describe('update', () => {
    it('should build ability and call service.update with ability', async () => {
      const dto: UpdateTodoDto = { completed: true };
      const result = await controller.update(mockTodoId, dto, mockJwtUser);
      expect(result).toEqual({ ...mockTodo, completed: true });
      expect(mockCaslAbilityFactory.defineAbilityFor).toHaveBeenCalledWith(
        mockJwtUser,
      );
      expect(service.update).toHaveBeenCalledWith(
        mockTodoId,
        dto,
        expect.anything(),
      );
    });
  });

  describe('remove', () => {
    it('should build ability and call service.remove with ability', async () => {
      const result = await controller.remove(mockTodoId, mockJwtUser);
      expect(result).toBeUndefined();
      expect(mockCaslAbilityFactory.defineAbilityFor).toHaveBeenCalledWith(
        mockJwtUser,
      );
      expect(service.remove).toHaveBeenCalledWith(
        mockTodoId,
        expect.anything(),
      );
    });
  });
});
