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
import { RolesService } from './roles.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CheckPermissions } from '../common/decorators/check-permissions.decorator';
import { Permission, getPermissionLabel } from '../common/enums/permission.enum';
import { successResponse, ApiResponse } from '../common/types/response';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  private mapRole(role: Role) {
    return {
      id: role.id,
      name: role.name,
      permissions: (role.permissions ?? []).map((p) => getPermissionLabel(p.code)).filter(Boolean),
      usersCount: role.users?.length ?? 0,
    };
  }

  @Get()
  @CheckPermissions(Permission.ROLE_VIEW)
  async findAll(): Promise<ApiResponse<any[]>> {
    const roles = await this.rolesService.findAll();
    return successResponse(roles.map((r) => this.mapRole(r)), 'Roles fetched successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckPermissions(Permission.ROLE_EDIT)
  async create(@Body() dto: CreateRoleDto): Promise<ApiResponse<any>> {
    const role = await this.rolesService.create(dto);
    return successResponse(this.mapRole(role), 'Role created successfully');
  }

  @Put(':id')
  @CheckPermissions(Permission.ROLE_EDIT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<ApiResponse<any>> {
    const role = await this.rolesService.update(id, dto);
    return successResponse(this.mapRole(role), 'Role updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @CheckPermissions(Permission.ROLE_EDIT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    await this.rolesService.delete(id);
    return successResponse(null, 'Role deleted successfully');
  }
}
