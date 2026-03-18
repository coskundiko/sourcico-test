import {
  Controller,
  Get,
  Post,
  Body,
  Session,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { successResponse, ApiResponse } from '../common/types/response';

interface AppSession extends Record<string, any> {
  userId?: number;
  destroy: (cb: (err: Error | null) => void) => void;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  async getAvailableUsers(): Promise<ApiResponse<{ id: number; name: string; email: string }[]>> {
    const users = await this.authService.getAllUsers();
    return successResponse(
      users.map((u) => ({ id: u.id, name: u.name, email: u.email })),
      'Available users fetched',
    );
  }

  @Post('select')
  @HttpCode(HttpStatus.OK)
  async selectUser(
    @Body('userId', ParseIntPipe) userId: number,
    @Session() session: AppSession,
  ): Promise<ApiResponse<ReturnType<AuthController['mapUserResponse']>>> {
    const user = await this.authService.validateUser(userId);
    const permissions = await this.authService.getOrCachePermissions(userId, user);
    session.userId = user.id;

    return successResponse(this.mapUserResponse(user, permissions), `Logged in as ${user.name}`);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Session() session: AppSession): Promise<ApiResponse<null>> {
    await new Promise<void>((resolve, reject) => {
      session.destroy((err: Error | null) => {
        if (err) reject(new Error('Failed to logout'));
        else resolve();
      });
    });

    return successResponse(null, 'Logged out successfully');
  }

  @Get('me')
  async me(
    @Session() session: AppSession,
  ): Promise<ApiResponse<ReturnType<AuthController['mapUserResponse']>>> {
    if (!session.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.authService.validateUser(session.userId);
    const permissions = await this.authService.getOrCachePermissions(session.userId, user);

    return successResponse(this.mapUserResponse(user, permissions), 'Current user profile fetched');
  }

  private mapUserResponse(user: User, permissions: string[]) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map((r) => r.name),
      permissions,
    };
  }
}