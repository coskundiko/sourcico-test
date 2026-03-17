import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PermissionsCacheService } from './permissions-cache/permissions-cache.service';
import { UserFactory } from '../database/factories/user.factory';
import { RoleFactory } from '../database/factories/role.factory';

const mockUsersService = {
  findById: jest.fn(),
  findAll: jest.fn(),
};

const mockPermissionsCacheService = {
  getPermissions: jest.fn(),
  setPermissions: jest.fn(),
  invalidate: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PermissionsCacheService, useValue: mockPermissionsCacheService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return the user when found', async () => {
      const user = UserFactory.build({ id: 1 });
      mockUsersService.findById.mockResolvedValue(user);

      const result = await service.validateUser(1);

      expect(result).toBe(user);
      expect(mockUsersService.findById).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.validateUser(999)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users from the service', async () => {
      const users = [UserFactory.build(), UserFactory.build()];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result).toBe(users);
    });
  });

  describe('getOrCachePermissions', () => {
    it('should return cached permissions on cache hit without re-caching', async () => {
      const cached = ['user.view', 'role.view'];
      mockPermissionsCacheService.getPermissions.mockResolvedValue(cached);

      const user = UserFactory.build({ id: 1, roles: [] });
      const result = await service.getOrCachePermissions(1, user);

      expect(result).toBe(cached);
      expect(mockPermissionsCacheService.setPermissions).not.toHaveBeenCalled();
    });

    it('should extract, cache and return permissions on cache miss', async () => {
      mockPermissionsCacheService.getPermissions.mockResolvedValue(null);
      mockPermissionsCacheService.setPermissions.mockResolvedValue(undefined);

      const adminRole = RoleFactory.getAdminRole();
      const user = UserFactory.buildWithRoles([adminRole], { id: 1 });

      const result = await service.getOrCachePermissions(1, user);

      expect(result).toEqual(
        expect.arrayContaining(['user.view', 'user.create', 'user.edit', 'user.delete', 'role.view', 'role.edit']),
      );
      expect(mockPermissionsCacheService.setPermissions).toHaveBeenCalledWith(1, expect.any(Array));
    });
  });

  describe('extractPermissions', () => {
    it('should map admin role to all 6 dot-notation permissions', () => {
      const user = UserFactory.buildWithRoles([RoleFactory.getAdminRole()]);

      const result = service.extractPermissions(user);

      expect(result).toEqual(
        expect.arrayContaining(['user.view', 'user.create', 'user.edit', 'user.delete', 'role.view', 'role.edit']),
      );
      expect(result).toHaveLength(6);
    });

    it('should map editor role to 3 permissions', () => {
      const user = UserFactory.buildWithRoles([RoleFactory.getEditorRole()]);

      const result = service.extractPermissions(user);

      expect(result).toEqual(expect.arrayContaining(['user.view', 'user.edit', 'role.view']));
      expect(result).toHaveLength(3);
    });

    it('should return only user.view for viewer role', () => {
      const user = UserFactory.buildWithRoles([RoleFactory.getViewerRole()]);

      const result = service.extractPermissions(user);

      expect(result).toEqual(['user.view']);
    });

    it('should deduplicate permissions across multiple roles', () => {
      const user = UserFactory.buildWithRoles([RoleFactory.getEditorRole(), RoleFactory.getViewerRole()]);

      const result = service.extractPermissions(user);

      const unique = new Set(result);
      expect(unique.size).toBe(result.length);
      expect(result).toHaveLength(3);
    });
  });
});
