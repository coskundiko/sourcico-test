import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserStatus } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserFactory } from '../database/factories/user.factory';
import { RoleFactory } from '../database/factories/role.factory';

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockRoleRepository = {
  findBy: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users and load the roles relation', async () => {
      const users = [UserFactory.build(), UserFactory.build()];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toBe(users);
      expect(mockUserRepository.find).toHaveBeenCalledWith({ relations: ['roles'] });
    });
  });

  describe('findById', () => {
    it('should return a user with roles and nested permissions', async () => {
      const user = UserFactory.build({ id: 5 });
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(5);

      expect(result).toBe(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: ['roles', 'roles.permissions'],
      });
    });

    it('should return null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email with roles and permissions', async () => {
      const user = UserFactory.build({ email: 'admin@test.com' });
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('admin@test.com');

      expect(result).toBe(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
        relations: ['roles', 'roles.permissions'],
      });
    });

    it('should return null when email is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@test.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const dto = { name: 'Alice', email: 'alice@test.com', roleIds: [1] };

    it('should create a user with the given roles', async () => {
      const role = RoleFactory.getViewerRole();
      const created = UserFactory.build({ name: dto.name, email: dto.email });

      mockUserRepository.findOne.mockResolvedValue(null); // no existing user
      mockRoleRepository.findBy.mockResolvedValue([role]);
      mockUserRepository.create.mockReturnValue(created);
      mockUserRepository.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toBe(created);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email, status: UserStatus.ACTIVE }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(UserFactory.build({ email: dto.email }));

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when a roleId does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findBy.mockResolvedValue([]); // roles not found

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user name and roles', async () => {
      const role = RoleFactory.getAdminRole();
      const user = UserFactory.build({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockRoleRepository.findBy.mockResolvedValue([role]);
      mockUserRepository.save.mockResolvedValue({ ...user, name: 'Updated', roles: [role] });

      const result = await service.update(1, { name: 'Updated', roleIds: [role.id] });

      expect(result.name).toBe('Updated');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when a roleId does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(UserFactory.build({ id: 1 }));
      mockRoleRepository.findBy.mockResolvedValue([]); // roles not found

      await expect(service.update(1, { roleIds: [999] })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should remove an existing user', async () => {
      const user = UserFactory.build({ id: 1 });
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(99)).rejects.toThrow(NotFoundException);
    });
  });
});
