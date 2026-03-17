import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/check-permissions.decorator';
import { Permission, PermissionLabels } from '../enums/permission.enum';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access (but usually we'd still want Auth)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const session = request.session;

    if (!session || !session.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.authService.validateUser(session.userId);
    const userPermissions = await this.authService.getOrCachePermissions(
      session.userId,
      user,
    );

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(PermissionLabels[permission]),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions');
    }

    return true;
  }
}
