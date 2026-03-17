import {
  Controller,
  Get,
  Post,
  Body,
  Session,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  async getAvailableUsers() {
    const users = await this.authService.getAllUsers();
    return {
      success: true,
      data: users.map((u) => ({ id: u.id, name: u.name, email: u.email })),
      message: 'Available users fetched',
      errors: null,
    };
  }

  @Post('select')
  @HttpCode(HttpStatus.OK)
  async selectUser(@Body('userId') userId: number, @Session() session: Record<string, any>) {
    const user = await this.authService.validateUser(userId);
    const permissions = await this.authService.getOrCachePermissions(userId, user);
    session.userId = user.id;

    return {
      success: true,
      data: this.mapUserResponse(user, permissions),
      message: `Logged in as ${user.name}`,
      errors: null,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Session() session: Record<string, any>) {
    await new Promise<void>((resolve, reject) => {
      session.destroy((err: Error | null) => {
        if (err) reject(new Error('Failed to logout'));
        else resolve();
      });
    });

    return {
      success: true,
      data: null,
      message: 'Logged out successfully',
      errors: null,
    };
  }

  @Get('me')
  async me(@Session() session: Record<string, any>) {
    if (!session.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.authService.validateUser(session.userId);
    const permissions = await this.authService.getOrCachePermissions(session.userId, user);

    return {
      success: true,
      data: this.mapUserResponse(user, permissions),
      message: 'Current user profile fetched',
      errors: null,
    };
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