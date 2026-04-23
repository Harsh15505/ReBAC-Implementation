import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

const mockUser = {
  _id: 'user-object-id',
  id: 'user-object-id',
  email: 'raj@example.com',
  password: 'hashed-password',
  role: 'user',
};

const mockUserModel = {
  findOne: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockUser),
  }),
  findById: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockUser),
  }),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      const result = await service.findByEmail('raj@example.com');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'raj@example.com',
      });
    });

    it('should lowercase the email before querying', async () => {
      await service.findByEmail('RAJ@EXAMPLE.COM');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'raj@example.com',
      });
    });

    it('should return null when user is not found', async () => {
      mockUserModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const result = await service.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found by id', async () => {
      const result = await service.findById(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null when user not found', async () => {
      mockUserModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      const result = await service.findById('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const saveMock = jest.fn().mockResolvedValue(mockUser);
      (service as any).userModel = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));
      const result = await service.create('RAJ@EXAMPLE.COM', 'hashed-pass');
      expect(result).toEqual(mockUser);
      expect((service as any).userModel).toHaveBeenCalledWith({
        email: 'raj@example.com',
        password: 'hashed-pass',
      });
    });
  });
});
