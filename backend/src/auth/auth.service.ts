import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PermissionsCacheService } from './permissions-cache/permissions-cache.service';
import { User } from '../users/entities/user.entity';
import { PermissionLabels } from '../common/enums/permission.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsCacheService: PermissionsCacheService,
  ) {}

  async validateUser(userId: number): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  async getOrCachePermissions(userId: number, user: User): Promise<string[]> {
    const cached = await this.permissionsCacheService.getPermissions(userId);
    if (cached) return cached;

    const permissions = this.extractPermissions(user);
    await this.permissionsCacheService.setPermissions(userId, permissions);
    return permissions;
  }

  extractPermissions(user: User): string[] {
    const permissions = new Set<string>();
    user.roles.forEach((role) => {
      role.permissions.forEach((perm) => {
        permissions.add(PermissionLabels[perm.code as keyof typeof PermissionLabels]);
      });
    });
    return Array.from(permissions);
  }
}