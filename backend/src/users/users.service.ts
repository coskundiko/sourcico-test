import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['roles'] });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async create(data: { name: string; email: string; roleIds: number[] }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const roles = await this.roleRepository.findBy({ id: In(data.roleIds) });
    if (roles.length !== data.roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      roles: roles,
      status: UserStatus.ACTIVE,
    });

    return this.userRepository.save(user);
  }

  async update(id: number, data: { name?: string; roleIds?: number[]; status?: string }): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.name) user.name = data.name;
    if (data.status) user.status = data.status as UserStatus;

    if (data.roleIds) {
      const roles = await this.roleRepository.findBy({ id: In(data.roleIds) });
      if (roles.length !== data.roleIds.length) {
        throw new NotFoundException('One or more roles not found');
      }
      user.roles = roles;
    }

    return this.userRepository.save(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.remove(user);
  }
}
