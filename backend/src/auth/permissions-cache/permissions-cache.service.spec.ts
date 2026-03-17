import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsCacheService } from './permissions-cache.service';

const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('PermissionsCacheService', () => {
  let service: PermissionsCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsCacheService,
        { provide: 'REDIS_CLIENT', useValue: mockRedisClient },
      ],
    }).compile();

    service = module.get<PermissionsCacheService>(PermissionsCacheService);
    jest.clearAllMocks();
  });

  describe('getPermissions', () => {
    it('should return parsed permissions array on cache hit', async () => {
      const perms = ['user.view', 'role.view'];
      mockRedisClient.get.mockResolvedValue(JSON.stringify(perms));

      const result = await service.getPermissions(1);

      expect(result).toEqual(perms);
      expect(mockRedisClient.get).toHaveBeenCalledWith('user_perms:1');
    });

    it('should return null on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getPermissions(1);

      expect(result).toBeNull();
    });
  });

  describe('setPermissions', () => {
    it('should store permissions as JSON with 24h TTL', async () => {
      const perms = ['user.view', 'user.edit'];
      await service.setPermissions(1, perms);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'user_perms:1',
        JSON.stringify(perms),
        { EX: 86400 },
      );
    });
  });

  describe('invalidate', () => {
    it('should delete the cache key for the given user', async () => {
      await service.invalidate(1);

      expect(mockRedisClient.del).toHaveBeenCalledWith('user_perms:1');
    });
  });
});