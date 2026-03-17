import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PermissionsCacheService } from './permissions-cache/permissions-cache.service';
import { PermissionsSubscriber } from '../common/subscribers/permissions.subscriber';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [AuthService, PermissionsCacheService, PermissionsSubscriber],
  exports: [AuthService, PermissionsCacheService, PermissionsSubscriber],
})
export class AuthModule {}
