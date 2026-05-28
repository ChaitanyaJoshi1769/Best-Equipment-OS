import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
  ) {}

  async create(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = this.vehiclesRepository.create(vehicleData);
    return this.vehiclesRepository.save(vehicle);
  }

  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
      relations: ['organization', 'assignedTechnician', 'jobs', 'telemetryEvents'],
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async findByAssetId(assetId: string, organizationId: string): Promise<Vehicle | null> {
    return this.vehiclesRepository.findOne({
      where: { assetId, organizationId },
      relations: ['organization', 'assignedTechnician'],
    });
  }

  async findByOrganization(organizationId: string, skip = 0, take = 20): Promise<[Vehicle[], number]> {
    return this.vehiclesRepository.findAndCount({
      where: { organizationId },
      skip,
      take,
      order: { createdAt: 'DESC' },
      relations: ['assignedTechnician'],
    });
  }

  async findByStatus(organizationId: string, status: string): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      where: { organizationId, status },
      relations: ['assignedTechnician'],
    });
  }

  async update(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    await this.vehiclesRepository.update(id, vehicleData);
    return this.findById(id);
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<void> {
    await this.vehiclesRepository.update(id, {
      location: `POINT(${latitude} ${longitude})`,
    });
  }

  async updateTelemetry(
    id: string,
    telemetryData: {
      fuel?: number;
      engineHours?: number;
      odometer?: number;
      speed?: number;
    },
  ): Promise<Vehicle> {
    await this.vehiclesRepository.update(id, {
      currentFuel: telemetryData.fuel,
      engineHours: telemetryData.engineHours,
      odometerReading: telemetryData.odometer,
    });
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.vehiclesRepository.softDelete(id);
  }

  async assignTechnician(vehicleId: string, technicianId: string): Promise<Vehicle> {
    await this.vehiclesRepository.update(vehicleId, {
      assignedTechnicianId: technicianId,
    });
    return this.findById(vehicleId);
  }

  async unassignTechnician(vehicleId: string): Promise<Vehicle> {
    await this.vehiclesRepository.update(vehicleId, {
      assignedTechnicianId: null,
    });
    return this.findById(vehicleId);
  }

  async getVehicleStats(organizationId: string) {
    const total = await this.vehiclesRepository.count({
      where: { organizationId },
    });

    const active = await this.vehiclesRepository.count({
      where: { organizationId, status: 'active' },
    });

    const maintenance = await this.vehiclesRepository.count({
      where: { organizationId, status: 'maintenance' },
    });

    return {
      total,
      active,
      maintenance,
      inactive: total - active - maintenance,
    };
  }
}
