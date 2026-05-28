import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceSchedule } from '../../database/entities';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceSchedule)
    private maintenanceRepository: Repository<MaintenanceSchedule>,
  ) {}

  async create(scheduleData: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const schedule = this.maintenanceRepository.create(scheduleData);
    return this.maintenanceRepository.save(schedule);
  }

  async findById(id: string): Promise<MaintenanceSchedule> {
    const schedule = await this.maintenanceRepository.findOne({
      where: { id },
    });
    if (!schedule) {
      throw new NotFoundException('Maintenance schedule not found');
    }
    return schedule;
  }

  async findByVehicle(vehicleId: string): Promise<MaintenanceSchedule[]> {
    return this.maintenanceRepository.find({
      where: { vehicleId },
      order: { nextDueDate: 'ASC' },
    });
  }

  async findByOrganization(organizationId: string): Promise<MaintenanceSchedule[]> {
    return this.maintenanceRepository.find({
      where: { organizationId },
      order: { nextDueDate: 'ASC' },
    });
  }

  async findDueSchedules(organizationId: string): Promise<MaintenanceSchedule[]> {
    const today = new Date();
    return this.maintenanceRepository
      .createQueryBuilder('schedule')
      .where('schedule.organizationId = :orgId', { orgId: organizationId })
      .andWhere('schedule.status = :status', { status: 'active' })
      .andWhere('schedule.nextDueDate <= :today', { today })
      .orderBy('schedule.nextDueDate', 'ASC')
      .getMany();
  }

  async findUpcomingSchedules(
    organizationId: string,
    daysAhead = 30,
  ): Promise<MaintenanceSchedule[]> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.maintenanceRepository
      .createQueryBuilder('schedule')
      .where('schedule.organizationId = :orgId', { orgId: organizationId })
      .andWhere('schedule.status = :status', { status: 'active' })
      .andWhere('schedule.nextDueDate > :today AND schedule.nextDueDate <= :futureDate', {
        today,
        futureDate,
      })
      .orderBy('schedule.nextDueDate', 'ASC')
      .getMany();
  }

  async update(
    id: string,
    scheduleData: Partial<MaintenanceSchedule>,
  ): Promise<MaintenanceSchedule> {
    await this.maintenanceRepository.update(id, scheduleData);
    return this.findById(id);
  }

  async markCompleted(id: string, completedDate?: Date): Promise<MaintenanceSchedule> {
    const schedule = await this.findById(id);

    const newDueDate = this.calculateNextDueDate(
      completedDate || new Date(),
      schedule.frequencyType,
      schedule.frequencyValue,
    );

    return this.update(id, {
      status: 'completed',
      nextDueDate: newDueDate,
    });
  }

  async reschedule(
    id: string,
    frequencyType: 'days' | 'months' | 'hours' | 'miles',
    frequencyValue: number,
  ): Promise<MaintenanceSchedule> {
    const schedule = await this.findById(id);

    if (!schedule.nextDueDate) {
      throw new BadRequestException('Cannot reschedule maintenance without a due date');
    }

    const newDueDate = this.calculateNextDueDate(
      new Date(),
      frequencyType,
      frequencyValue,
    );

    return this.update(id, {
      frequencyType,
      frequencyValue,
      nextDueDate: newDueDate,
    });
  }

  async cancel(id: string): Promise<MaintenanceSchedule> {
    return this.update(id, { status: 'inactive' });
  }

  async delete(id: string): Promise<void> {
    const schedule = await this.findById(id);
    await this.maintenanceRepository.remove(schedule);
  }

  private calculateNextDueDate(
    baseDate: Date,
    frequencyType: string | null,
    frequencyValue: number | null,
  ): Date {
    if (!frequencyType || !frequencyValue) {
      return null;
    }

    const dueDate = new Date(baseDate);

    switch (frequencyType) {
      case 'days':
        dueDate.setDate(dueDate.getDate() + frequencyValue);
        break;
      case 'months':
        dueDate.setMonth(dueDate.getMonth() + frequencyValue);
        break;
      case 'hours':
        dueDate.setHours(dueDate.getHours() + frequencyValue);
        break;
      case 'miles':
        dueDate.setDate(dueDate.getDate() + Math.ceil(frequencyValue / 100));
        break;
      default:
        return null;
    }

    return dueDate;
  }

  async bulkCreate(schedules: Partial<MaintenanceSchedule>[]): Promise<MaintenanceSchedule[]> {
    const savedSchedules = schedules.map((s) => this.maintenanceRepository.create(s));
    return this.maintenanceRepository.save(savedSchedules);
  }

  async getMaintenanceStats(organizationId: string) {
    const total = await this.maintenanceRepository.count({
      where: { organizationId },
    });

    const active = await this.maintenanceRepository.count({
      where: { organizationId, status: 'active' },
    });

    const completed = await this.maintenanceRepository.count({
      where: { organizationId, status: 'completed' },
    });

    const dueSchedules = await this.findDueSchedules(organizationId);
    const upcomingSchedules = await this.findUpcomingSchedules(organizationId);

    return {
      total,
      active,
      completed,
      inactive: total - active - completed,
      overdue: dueSchedules.length,
      upcomingIn30Days: upcomingSchedules.length,
    };
  }
}
