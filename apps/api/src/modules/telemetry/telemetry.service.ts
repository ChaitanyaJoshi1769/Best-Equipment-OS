import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TelemetryEvent } from '../../database/entities';

interface TelemetryEventInput {
  vehicleId: string;
  organizationId: string;
  eventType: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  fuelLevel?: number;
  engineHours?: number;
  eventTimestamp?: Date;
}

@Injectable()
export class TelemetryService {
  constructor(
    @InjectRepository(TelemetryEvent)
    private telemetryRepository: Repository<TelemetryEvent>,
  ) {}

  async create(eventData: TelemetryEventInput): Promise<TelemetryEvent> {
    const event = this.telemetryRepository.create({
      ...eventData,
      receivedAt: new Date(),
    });
    return this.telemetryRepository.save(event);
  }

  async bulkCreate(events: TelemetryEventInput[]): Promise<TelemetryEvent[]> {
    const telemetryEvents = events.map((event) =>
      this.telemetryRepository.create({
        ...event,
        receivedAt: new Date(),
      }),
    );
    return this.telemetryRepository.save(telemetryEvents);
  }

  async findById(id: string): Promise<TelemetryEvent> {
    const event = await this.telemetryRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });
    if (!event) {
      throw new NotFoundException('Telemetry event not found');
    }
    return event;
  }

  async findByVehicle(vehicleId: string, limit = 100): Promise<TelemetryEvent[]> {
    return this.telemetryRepository.find({
      where: { vehicleId },
      order: { receivedAt: 'DESC' },
      take: limit,
      relations: ['vehicle'],
    });
  }

  async findByVehicleAndDateRange(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TelemetryEvent[]> {
    return this.telemetryRepository.find({
      where: {
        vehicleId,
        receivedAt: Between(startDate, endDate),
      },
      order: { receivedAt: 'ASC' },
      relations: ['vehicle'],
    });
  }

  async findByOrganizationAndDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    eventType?: string,
  ): Promise<TelemetryEvent[]> {
    const query = this.telemetryRepository
      .createQueryBuilder('telemetry')
      .where('telemetry.organizationId = :orgId', { orgId: organizationId })
      .andWhere('telemetry.receivedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .leftJoinAndSelect('telemetry.vehicle', 'vehicle')
      .orderBy('telemetry.receivedAt', 'ASC');

    if (eventType) {
      query.andWhere('telemetry.eventType = :eventType', { eventType });
    }

    return query.getMany();
  }

  async findByEventType(
    organizationId: string,
    eventType: string,
    limit = 100,
  ): Promise<TelemetryEvent[]> {
    return this.telemetryRepository.find({
      where: { organizationId, eventType },
      order: { receivedAt: 'DESC' },
      take: limit,
      relations: ['vehicle'],
    });
  }

  async getLatestByVehicle(vehicleId: string): Promise<TelemetryEvent | null> {
    return this.telemetryRepository.findOne({
      where: { vehicleId },
      order: { receivedAt: 'DESC' },
      relations: ['vehicle'],
    });
  }

  async getLatestByOrganization(organizationId: string, limit = 100) {
    return this.telemetryRepository.find({
      where: { organizationId },
      order: { receivedAt: 'DESC' },
      take: limit,
      relations: ['vehicle'],
    });
  }

  async getVehicleLocationHistory(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TelemetryEvent[]> {
    return this.telemetryRepository.find({
      where: {
        vehicleId,
        receivedAt: Between(startDate, endDate),
      },
      order: { receivedAt: 'ASC' },
    });
  }

  async getVehicleSpeedMetrics(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ maxSpeed: number; avgSpeed: number; sampleCount: number }> {
    const events = await this.telemetryRepository.find({
      where: {
        vehicleId,
        receivedAt: Between(startDate, endDate),
      },
    });

    const speedReadings = events
      .filter((e) => e.speed !== null && e.speed !== undefined)
      .map((e) => e.speed);

    if (speedReadings.length === 0) {
      return { maxSpeed: 0, avgSpeed: 0, sampleCount: 0 };
    }

    const maxSpeed = Math.max(...speedReadings);
    const avgSpeed = speedReadings.reduce((a, b) => a + b, 0) / speedReadings.length;

    return {
      maxSpeed: Math.round(maxSpeed * 100) / 100,
      avgSpeed: Math.round(avgSpeed * 100) / 100,
      sampleCount: speedReadings.length,
    };
  }

  async getFuelConsumptionTrend(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ timestamp: Date; fuelLevel: number }>> {
    const events = await this.telemetryRepository.find({
      where: {
        vehicleId,
        receivedAt: Between(startDate, endDate),
      },
      order: { receivedAt: 'ASC' },
    });

    return events
      .filter((e) => e.fuelLevel !== null && e.fuelLevel !== undefined)
      .map((e) => ({
        timestamp: e.receivedAt,
        fuelLevel: e.fuelLevel,
      }));
  }

  async deleteOldEvents(organizationId: string, cutoffDate: Date): Promise<number> {
    const result = await this.telemetryRepository.delete({
      organizationId,
      receivedAt: Between(new Date('2000-01-01'), cutoffDate),
    });
    return result.affected || 0;
  }
}
