import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceSchedule } from '../../database/entities';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Post()
  async createSchedule(@Body() scheduleData: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    return this.maintenanceService.create(scheduleData);
  }

  @Post('bulk')
  async bulkCreateSchedules(@Body('schedules') schedules: Partial<MaintenanceSchedule>[]) {
    return this.maintenanceService.bulkCreate(schedules);
  }

  @Get(':id')
  async getSchedule(@Param('id') id: string): Promise<MaintenanceSchedule> {
    return this.maintenanceService.findById(id);
  }

  @Get('vehicle/:vehicleId')
  async getVehicleSchedules(@Param('vehicleId') vehicleId: string): Promise<MaintenanceSchedule[]> {
    return this.maintenanceService.findByVehicle(vehicleId);
  }

  @Get('organization/:organizationId/all')
  async getOrganizationSchedules(
    @Param('organizationId') organizationId: string,
  ): Promise<MaintenanceSchedule[]> {
    return this.maintenanceService.findByOrganization(organizationId);
  }

  @Get('organization/:organizationId/due')
  async getDueSchedules(
    @Param('organizationId') organizationId: string,
  ): Promise<MaintenanceSchedule[]> {
    return this.maintenanceService.findDueSchedules(organizationId);
  }

  @Get('organization/:organizationId/upcoming')
  async getUpcomingSchedules(
    @Param('organizationId') organizationId: string,
    @Query('days') days = 30,
  ): Promise<MaintenanceSchedule[]> {
    return this.maintenanceService.findUpcomingSchedules(organizationId, days);
  }

  @Get('organization/:organizationId/stats')
  async getStats(@Param('organizationId') organizationId: string) {
    return this.maintenanceService.getMaintenanceStats(organizationId);
  }

  @Patch(':id')
  async updateSchedule(
    @Param('id') id: string,
    @Body() scheduleData: Partial<MaintenanceSchedule>,
  ): Promise<MaintenanceSchedule> {
    return this.maintenanceService.update(id, scheduleData);
  }

  @Post(':id/mark-completed')
  async markCompleted(
    @Param('id') id: string,
    @Body('completedDate') completedDate?: string,
  ): Promise<MaintenanceSchedule> {
    return this.maintenanceService.markCompleted(
      id,
      completedDate ? new Date(completedDate) : undefined,
    );
  }

  @Post(':id/reschedule')
  async reschedule(
    @Param('id') id: string,
    @Body() { frequencyType, frequencyValue }: { frequencyType: string; frequencyValue: number },
  ): Promise<MaintenanceSchedule> {
    return this.maintenanceService.reschedule(
      id,
      frequencyType as 'days' | 'months' | 'hours' | 'miles',
      frequencyValue,
    );
  }

  @Post(':id/cancel')
  async cancelSchedule(@Param('id') id: string): Promise<MaintenanceSchedule> {
    return this.maintenanceService.cancel(id);
  }

  @Delete(':id')
  async deleteSchedule(@Param('id') id: string): Promise<void> {
    return this.maintenanceService.delete(id);
  }
}
