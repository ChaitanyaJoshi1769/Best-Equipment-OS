import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('telemetry')
@UseGuards(JwtAuthGuard)
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Post()
  async createEvent(@Body() eventData: any) {
    return this.telemetryService.create(eventData);
  }

  @Post('bulk')
  async bulkCreateEvents(@Body('events') events: any[]) {
    return this.telemetryService.bulkCreate(events);
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return this.telemetryService.findById(id);
  }

  @Get('vehicle/:vehicleId')
  async getVehicleEvents(
    @Param('vehicleId') vehicleId: string,
    @Query('limit') limit = 100,
  ) {
    return this.telemetryService.findByVehicle(vehicleId, limit);
  }

  @Get('vehicle/:vehicleId/latest')
  async getLatestVehicleEvent(@Param('vehicleId') vehicleId: string) {
    return this.telemetryService.getLatestByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  async getVehicleHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.telemetryService.getVehicleLocationHistory(
      vehicleId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('vehicle/:vehicleId/speed-metrics')
  async getSpeedMetrics(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.telemetryService.getVehicleSpeedMetrics(
      vehicleId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('vehicle/:vehicleId/fuel-trend')
  async getFuelTrend(
    @Param('vehicleId') vehicleId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.telemetryService.getFuelConsumptionTrend(
      vehicleId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('organization/:organizationId/latest')
  async getOrganizationLatest(
    @Param('organizationId') organizationId: string,
    @Query('limit') limit = 100,
  ) {
    return this.telemetryService.getLatestByOrganization(organizationId, limit);
  }

  @Get('organization/:organizationId/range')
  async getOrganizationByDateRange(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('eventType') eventType?: string,
  ) {
    return this.telemetryService.findByOrganizationAndDateRange(
      organizationId,
      new Date(startDate),
      new Date(endDate),
      eventType,
    );
  }

  @Get('organization/:organizationId/by-type/:eventType')
  async getByEventType(
    @Param('organizationId') organizationId: string,
    @Param('eventType') eventType: string,
    @Query('limit') limit = 100,
  ) {
    return this.telemetryService.findByEventType(organizationId, eventType, limit);
  }

  @Delete('organization/:organizationId/older-than')
  async deleteOldEvents(
    @Param('organizationId') organizationId: string,
    @Query('cutoffDate') cutoffDate: string,
  ) {
    const deletedCount = await this.telemetryService.deleteOldEvents(
      organizationId,
      new Date(cutoffDate),
    );
    return { deletedCount };
  }
}
