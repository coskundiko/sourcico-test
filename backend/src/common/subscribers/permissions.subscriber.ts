import {
  EntitySubscriberInterface,
  UpdateEvent,
  InsertEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { RolePermission } from '../../roles/entities/role-permission.entity';
import { PermissionsCacheService } from '../../auth/permissions-cache/permissions-cache.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly permissionsCacheService: PermissionsCacheService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>) {
    await this.handleInvalidation(event);
  }

  async afterUpdate(event: UpdateEvent<any>) {
    await this.handleInvalidation(event);
  }

  async afterRemove(event: RemoveEvent<any>) {
    await this.handleInvalidation(event);
  }

  private async handleInvalidation(event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>) {
    const entity = event.entity ?? (event as UpdateEvent<any> | RemoveEvent<any>).databaseEntity;
    if (!entity) return;

    if (entity instanceof User) {
      await this.permissionsCacheService.invalidate(entity.id);
    } else if (entity instanceof Role) {
      await this.invalidateUsersByRoleId(entity.id);
    } else if (entity instanceof RolePermission) {
      const roleId = entity.role?.id || entity.roleId;
      if (roleId) {
        await this.invalidateUsersByRoleId(roleId);
      }
    }
  }

  private async invalidateUsersByRoleId(roleId: number) {
    const users = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoin('user_roles', 'ur', 'ur.user_id = user.id')
      .where('ur.role_id = :roleId', { roleId })
      .select('user.id')
      .getMany();

    for (const user of users) {
      await this.permissionsCacheService.invalidate(user.id);
    }
  }
}
