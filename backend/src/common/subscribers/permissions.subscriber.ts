import {
  EntitySubscriberInterface,
  UpdateEvent,
  InsertEvent,
  RemoveEvent,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { RolePermission } from '../../roles/entities/role-permission.entity';
import { PermissionsCacheService } from '../../auth/permissions-cache/permissions-cache.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

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
    } else if (entity instanceof Role || entity instanceof RolePermission) {
      await this.permissionsCacheService.clearAll();
    }
  }
}
