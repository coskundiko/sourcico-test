import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CheckPermissions } from '../common/decorators/check-permissions.decorator';
import { Permission } from '../common/enums/permission.enum';
import { successResponse, ApiResponse } from '../common/types/response';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @CheckPermissions(Permission.USER_VIEW)
  async findAll(): Promise<ApiResponse<any[]>> {
    const users = await this.usersService.findAll();
    return successResponse(users, 'Users fetched successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckPermissions(Permission.USER_CREATE)
  async create(@Body() dto: CreateUserDto): Promise<ApiResponse<any>> {
    const user = await this.usersService.create(dto);
    return successResponse(user, 'User created successfully');
  }

  @Put(':id')
  @CheckPermissions(Permission.USER_EDIT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<ApiResponse<any>> {
    const user = await this.usersService.update(id, dto);
    return successResponse(user, 'User updated successfully');
  }

  @Delete(':id')
  @CheckPermissions(Permission.USER_DELETE)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    await this.usersService.delete(id);
    return successResponse(null, 'User deleted successfully');
  }
}
