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
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Organization } from '../../database/entities';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  async createOrganization(
    @Body() organizationData: Partial<Organization>,
  ): Promise<Organization> {
    return this.organizationsService.create(organizationData);
  }

  @Get()
  async getAllOrganizations(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    const [organizations, count] = await this.organizationsService.findAll(skip, take);
    return { data: organizations, total: count, skip, take };
  }

  @Get(':id')
  async getOrganization(@Param('id') id: string): Promise<Organization> {
    return this.organizationsService.findById(id);
  }

  @Get(':id/stats')
  async getOrganizationStats(@Param('id') id: string) {
    return this.organizationsService.getStats(id);
  }

  @Patch(':id')
  async updateOrganization(
    @Param('id') id: string,
    @Body() organizationData: Partial<Organization>,
  ): Promise<Organization> {
    return this.organizationsService.update(id, organizationData);
  }

  @Delete(':id')
  async deleteOrganization(@Param('id') id: string): Promise<void> {
    return this.organizationsService.delete(id);
  }

  @Post(':id/restore')
  async restoreOrganization(@Param('id') id: string): Promise<Organization> {
    return this.organizationsService.restore(id);
  }
}
