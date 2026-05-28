import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, Permission } from '../../database/entities';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  async createRole(@Body() roleData: Partial<Role>): Promise<Role> {
    return this.rolesService.create(roleData);
  }

  @Get()
  async getRolesByOrganization(@Query('organizationId') organizationId: string): Promise<Role[]> {
    return this.rolesService.findByOrganization(organizationId);
  }

  @Get(':id')
  async getRole(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() roleData: Partial<Role>,
  ): Promise<Role> {
    return this.rolesService.update(id, roleData);
  }

  @Delete(':id')
  async deleteRole(@Param('id') id: string): Promise<void> {
    return this.rolesService.delete(id);
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string): Promise<Permission[]> {
    return this.rolesService.getPermissions(id);
  }

  @Post(':id/permissions')
  async addPermission(
    @Param('id') id: string,
    @Body() permission: Permission,
  ): Promise<Role> {
    return this.rolesService.addPermission(id, permission);
  }

  @Delete(':id/permissions/:resource/:action')
  async removePermission(
    @Param('id') id: string,
    @Param('resource') resource: string,
    @Param('action') action: string,
  ): Promise<Role> {
    return this.rolesService.removePermission(id, resource, action);
  }
}
