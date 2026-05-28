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
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Vehicle } from '../../database/entities';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Post()
  async createVehicle(@Body() vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    return this.vehiclesService.create(vehicleData);
  }

  @Get()
  async listVehicles(
    @Query('organizationId') organizationId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    const [vehicles, count] = await this.vehiclesService.findByOrganization(organizationId, skip, take);
    return { data: vehicles, total: count, skip, take };
  }

  @Get('status/:status')
  async getVehiclesByStatus(
    @Query('organizationId') organizationId: string,
    @Param('status') status: string,
  ): Promise<Vehicle[]> {
    return this.vehiclesService.findByStatus(organizationId, status);
  }

  @Get('stats')
  async getStats(@Query('organizationId') organizationId: string) {
    return this.vehiclesService.getVehicleStats(organizationId);
  }

  @Get(':id')
  async getVehicle(@Param('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.findById(id);
  }

  @Patch(':id')
  async updateVehicle(
    @Param('id') id: string,
    @Body() vehicleData: Partial<Vehicle>,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, vehicleData);
  }

  @Patch(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body() { latitude, longitude }: { latitude: number; longitude: number },
  ): Promise<void> {
    return this.vehiclesService.updateLocation(id, latitude, longitude);
  }

  @Patch(':id/telemetry')
  async updateTelemetry(
    @Param('id') id: string,
    @Body() telemetryData: any,
  ): Promise<Vehicle> {
    return this.vehiclesService.updateTelemetry(id, telemetryData);
  }

  @Post(':id/assign-technician')
  async assignTechnician(
    @Param('id') id: string,
    @Body('technicianId') technicianId: string,
  ): Promise<Vehicle> {
    return this.vehiclesService.assignTechnician(id, technicianId);
  }

  @Post(':id/unassign-technician')
  async unassignTechnician(@Param('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.unassignTechnician(id);
  }

  @Delete(':id')
  async deleteVehicle(@Param('id') id: string): Promise<void> {
    return this.vehiclesService.delete(id);
  }
}
