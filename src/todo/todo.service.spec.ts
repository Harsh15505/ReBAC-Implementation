import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TodoService } from './todo.service';
import { Todo } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { JwtUser } from '../auth/decorators/current-user.decorator';

const mockUserId = new Types.ObjectId().toHexString();
const mockTodoId = new Types.ObjectId().toHexString();
const mockOtherUserId = new Types.ObjectId().toHexString();
const mockAdminUserId = new Types.ObjectId().toHexString();

const mockOwnerUser: JwtUser = { userId: mockUserId, email: 'owner@example.com', role: 'user' };
const mockAdminUser: JwtUser = { userId: mockAdminUserId, email: 'admin@example.com', role: 'admin' };
const mockOtherUser: JwtUser = { userId: mockOtherUserId, email: 'other@example.com', role: 'user' };

const buildMockTodo = () => ({
  _id: mockTodoId,
  title: 'Learn Unit Testing',
  description: 'Write tests for Todo app',
  completed: false,
  userId: new Types.ObjectId(mockUserId),
  toObject: () => ({
    _id: mockTodoId,
    title: 'Learn Unit Testing',
    completed: false,
    userId: new Types.ObjectId(mockUserId),
  }),
  created_at: new Date(),
  updated_at: new Date(),
});

describe('TodoService', () => {
  let service: TodoService;
  let caslFactory: CaslAbilityFactory;
  let mockTodoModel: any;

  beforeEach(async () => {
    const mockTodo = buildMockTodo();

    mockTodoModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTodo]),
        }),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTodo),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockTodo, completed: true }),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTodo),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        CaslAbilityFactory,
        {
          provide: getModelToken(Todo.name),
          useValue: mockTodoModel,
        },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    caslFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(mockTodoModel.find).toHaveBeenCalled();
    });

    it('should return empty array when no todos exist', async () => {
      mockTodoModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a todo by id', async () => {
      const result = await service.findOne(mockTodoId);
      expect(result._id).toBe(mockTodoId);
      expect(mockTodoModel.findById).toHaveBeenCalledWith(mockTodoId);
    });

    it('should throw NotFoundException when todo is not found', async () => {
      mockTodoModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and save a new todo', async () => {
      const createDto: CreateTodoDto = {
        title: 'Buy groceries',
        description: 'Milk and eggs',
      };
      const mockTodo = buildMockTodo();
      const saveMock = jest.fn().mockResolvedValue(mockTodo);
      (service as any).todoModel = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));
      const result = await service.create(createDto, mockUserId);
      expect(result).toEqual(mockTodo);
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update and return the todo when owner calls it', async () => {
      const updateDto: UpdateTodoDto = { completed: true };
      const ability = caslFactory.defineAbilityFor(mockOwnerUser);
      const result = await service.update(mockTodoId, updateDto, ability);
      expect(result.completed).toBe(true);
      expect(mockTodoModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTodoId,
        updateDto,
        { new: true },
      );
    });

    it('should throw NotFoundException when todo does not exist', async () => {
      mockTodoModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const ability = caslFactory.defineAbilityFor(mockOwnerUser);
      await expect(
        service.update('nonexistent-id', { completed: true }, ability),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when a user tries to update another user todo', async () => {
      const ability = caslFactory.defineAbilityFor(mockOtherUser);
      await expect(
        service.update(mockTodoId, { title: 'Hacked' }, ability),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any todo', async () => {
      const updateDto: UpdateTodoDto = { completed: true };
      const ability = caslFactory.defineAbilityFor(mockAdminUser);
      const result = await service.update(mockTodoId, updateDto, ability);
      expect(result.completed).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete a todo when owner calls it', async () => {
      const ability = caslFactory.defineAbilityFor(mockOwnerUser);
      await expect(service.remove(mockTodoId, ability)).resolves.toBeUndefined();
      expect(mockTodoModel.findByIdAndDelete).toHaveBeenCalledWith(mockTodoId);
    });

    it('should throw NotFoundException when todo does not exist', async () => {
      mockTodoModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const ability = caslFactory.defineAbilityFor(mockOwnerUser);
      await expect(service.remove('ghost-id', ability)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when a user tries to delete another user todo', async () => {
      const ability = caslFactory.defineAbilityFor(mockOtherUser);
      await expect(service.remove(mockTodoId, ability)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to delete any todo', async () => {
      const ability = caslFactory.defineAbilityFor(mockAdminUser);
      await expect(service.remove(mockTodoId, ability)).resolves.toBeUndefined();
    });
  });
});
