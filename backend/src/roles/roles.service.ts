import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async findById(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.name) {
        role.name = dto.name;
      }

      if (dto.permissionCodes) {
        await manager.delete(RolePermission, { role: { id } });
        role.permissions = dto.permissionCodes.map((code) => {
          const perm = new RolePermission();
          perm.code = code;
          perm.role = role;
          return perm;
        });
      }

      return manager.save(Role, role);
    });
  }
}
