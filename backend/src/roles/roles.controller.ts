import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CheckPermissions } from '../common/decorators/check-permissions.decorator';
import { Permission } from '../common/enums/permission.enum';
import { successResponse, ApiResponse } from '../common/types/response';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @CheckPermissions(Permission.ROLE_VIEW)
  async findAll(): Promise<ApiResponse<any[]>> {
    const roles = await this.rolesService.findAll();
    return successResponse(roles, 'Roles fetched successfully');
  }

  @Put(':id')
  @CheckPermissions(Permission.ROLE_EDIT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<ApiResponse<any>> {
    const role = await this.rolesService.update(id, dto);
    return successResponse(role, 'Role updated successfully');
  }
}
