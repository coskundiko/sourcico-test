import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserFactory } from '../database/factories/user.factory';
import { RoleFactory } from '../database/factories/role.factory';

const mockAuthService = {
  getAllUsers: jest.fn(),
  validateUser: jest.fn(),
  getOrCachePermissions: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('getAvailableUsers', () => {
    it('should return a mapped list with only id, name, email', async () => {
      const users = [
        UserFactory.build({ id: 1, name: 'Admin User', email: 'admin@test.com' }),
        UserFactory.build({ id: 2, name: 'Editor User', email: 'editor@test.com' }),
      ];
      mockAuthService.getAllUsers.mockResolvedValue(users);

      const result = await controller.getAvailableUsers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, name: 'Admin User', email: 'admin@test.com' },
        { id: 2, name: 'Editor User', email: 'editor@test.com' },
      ]);
    });
  });

  describe('selectUser', () => {
    it('should set session.userId and return user with permissions', async () => {
      const adminRole = RoleFactory.getAdminRole();
      const user = UserFactory.buildWithRoles([adminRole], { id: 1, name: 'Admin User', email: 'admin@test.com' });
      const permissions = ['user.view', 'role.edit'];
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.getOrCachePermissions.mockResolvedValue(permissions);

      const session: any = {};
      const result = await controller.selectUser(1, session);

      expect(session.userId).toBe(1);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Admin User');
      expect(result.data.permissions).toBe(permissions);
      expect(result.message).toBe('Logged in as Admin User');
    });
  });

  describe('logout', () => {
    it('should destroy the session and return success', async () => {
      const session: any = { destroy: jest.fn((cb) => cb(null)) };

      const result = await controller.logout(session);

      expect(session.destroy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Logged out successfully');
    });

    it('should throw when session destruction fails', async () => {
      const session: any = { destroy: jest.fn((cb) => cb(new Error('Redis error'))) };

      await expect(controller.logout(session)).rejects.toThrow('Failed to logout');
    });
  });

  describe('me', () => {
    it('should throw UnauthorizedException when session has no userId', async () => {
      await expect(controller.me({})).rejects.toThrow(UnauthorizedException);
    });

    it('should return the current user with roles and permissions', async () => {
      const adminRole = RoleFactory.getAdminRole();
      const user = UserFactory.buildWithRoles([adminRole], { id: 1, name: 'Admin User', email: 'admin@test.com' });
      const permissions = ['user.view', 'role.edit'];
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.getOrCachePermissions.mockResolvedValue(permissions);

      const result = await controller.me({ userId: 1 });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.email).toBe('admin@test.com');
      expect(result.data.roles).toEqual(['Admin']);
      expect(result.data.permissions).toBe(permissions);
    });
  });
});
