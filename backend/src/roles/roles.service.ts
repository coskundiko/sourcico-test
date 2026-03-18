import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { PermissionsCacheService } from '../auth/permissions-cache/permissions-cache.service';

const PROTECTED_ROLES = ['admin'];
const isProtected = (name: string) => PROTECTED_ROLES.includes(name.toLowerCase());

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly dataSource: DataSource,
    private readonly permissionsCacheService: PermissionsCacheService,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions', 'users'], order: { name: 'ASC' } });
  }

  async findById(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({ where: { name: dto.name }, relations: ['permissions', 'users'] });
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }
    const role = this.roleRepository.create({ name: dto.name, permissions: [], users: [] });
    return this.roleRepository.save(role);
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (isProtected(role.name) && dto.permissionCodes !== undefined) {
      throw new BadRequestException('Cannot modify permissions of the Admin role');
    }

    const result = await this.dataSource.transaction(async (manager) => {
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

    await this.permissionsCacheService.clearAll();
    return result;
  }

  async delete(id: number): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (isProtected(role.name)) {
      throw new BadRequestException('Cannot delete the Admin role');
    }

    if (role.users && role.users.length > 0) {
      throw new BadRequestException('Cannot delete a role that still has users assigned');
    }

    await this.roleRepository.remove(role);
    await this.permissionsCacheService.clearAll();
  }
}
