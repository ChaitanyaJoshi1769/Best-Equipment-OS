import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Permission } from '../../database/entities';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(roleData: Partial<Role>): Promise<Role> {
    const role = this.rolesRepository.create(roleData);
    return this.rolesRepository.save(role);
  }

  async findById(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findByOrganization(organizationId: string): Promise<Role[]> {
    return this.rolesRepository.find({
      where: { organizationId },
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    await this.rolesRepository.update(id, roleData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }
    await this.rolesRepository.delete(id);
  }

  async addPermission(roleId: string, permission: Permission): Promise<Role> {
    const role = await this.findById(roleId);

    if (!role.permissions) {
      role.permissions = [];
    }

    // Check if permission already exists
    const exists = role.permissions.some((p) => p.resource === permission.resource);
    if (exists) {
      // Merge actions
      const idx = role.permissions.findIndex((p) => p.resource === permission.resource);
      role.permissions[idx].actions = Array.from(
        new Set([...role.permissions[idx].actions, ...permission.actions]),
      );
    } else {
      role.permissions.push(permission);
    }

    return this.rolesRepository.save(role);
  }

  async removePermission(roleId: string, resource: string, action: string): Promise<Role> {
    const role = await this.findById(roleId);

    if (!role.permissions) {
      return role;
    }

    role.permissions = role.permissions
      .map((p) => {
        if (p.resource === resource) {
          return {
            ...p,
            actions: p.actions.filter((a) => a !== action),
          };
        }
        return p;
      })
      .filter((p) => p.actions.length > 0);

    return this.rolesRepository.save(role);
  }

  async getPermissions(roleId: string): Promise<Permission[]> {
    const role = await this.findById(roleId);
    return role.permissions || [];
  }
}
