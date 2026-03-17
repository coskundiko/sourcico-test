import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserFactory } from '../database/factories/user.factory';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users and load the roles relation', async () => {
      const users = [UserFactory.build(), UserFactory.build()];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toBe(users);
      expect(mockRepository.find).toHaveBeenCalledWith({ relations: ['roles'] });
    });
  });

  describe('findById', () => {
    it('should return a user with roles and nested permissions', async () => {
      const user = UserFactory.build({ id: 5 });
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(5);

      expect(result).toBe(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: ['roles', 'roles.permissions'],
      });
    });

    it('should return null when user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email with roles and permissions', async () => {
      const user = UserFactory.build({ email: 'admin@test.com' });
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('admin@test.com');

      expect(result).toBe(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
        relations: ['roles', 'roles.permissions'],
      });
    });

    it('should return null when email is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@test.com');

      expect(result).toBeNull();
    });
  });
});
