import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Job } from '../../database/entities';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
  ) {}

  async create(jobData: Partial<Job>): Promise<Job> {
    // Generate unique job number
    const jobNumber = `JOB-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const job = this.jobsRepository.create({
      ...jobData,
      jobNumber,
      status: 'pending',
    });
    return this.jobsRepository.save(job);
  }

  async findById(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: { id },
      relations: ['organization', 'vehicle', 'assignedTechnician', 'serviceLogs'],
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async findByJobNumber(jobNumber: string, organizationId: string): Promise<Job | null> {
    return this.jobsRepository.findOne({
      where: { jobNumber, organizationId },
      relations: ['organization', 'vehicle', 'assignedTechnician', 'serviceLogs'],
    });
  }

  async findByOrganization(organizationId: string, skip = 0, take = 20): Promise<[Job[], number]> {
    return this.jobsRepository.findAndCount({
      where: { organizationId },
      skip,
      take,
      order: { createdAt: 'DESC' },
      relations: ['vehicle', 'assignedTechnician'],
    });
  }

  async findByStatus(organizationId: string, status: string[]): Promise<Job[]> {
    return this.jobsRepository
      .createQueryBuilder('job')
      .where('job.organizationId = :orgId', { orgId: organizationId })
      .andWhere('job.status IN (:...statuses)', { statuses: status })
      .orderBy('job.priority', 'DESC')
      .addOrderBy('job.scheduledDate', 'ASC')
      .leftJoinAndSelect('job.assignedTechnician', 'technician')
      .leftJoinAndSelect('job.vehicle', 'vehicle')
      .getMany();
  }

  async findByDateRange(organizationId: string, startDate: Date, endDate: Date): Promise<Job[]> {
    return this.jobsRepository.find({
      where: {
        organizationId,
        scheduledDate: Between(startDate, endDate),
      },
      relations: ['vehicle', 'assignedTechnician'],
      order: { scheduledDate: 'ASC', scheduledStartTime: 'ASC' },
    });
  }

  async findByTechnician(technicianId: string): Promise<Job[]> {
    return this.jobsRepository.find({
      where: { assignedTechnicianId: technicianId },
      relations: ['vehicle', 'organization'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async update(id: string, jobData: Partial<Job>): Promise<Job> {
    await this.jobsRepository.update(id, jobData);
    return this.findById(id);
  }

  async assign(jobId: string, technicianId: string): Promise<Job> {
    const job = await this.findById(jobId);

    if (job.status !== 'pending') {
      throw new BadRequestException('Can only assign pending jobs');
    }

    return this.update(jobId, {
      assignedTechnicianId: technicianId,
      status: 'assigned',
    });
  }

  async start(jobId: string): Promise<Job> {
    const job = await this.findById(jobId);

    if (job.status !== 'assigned') {
      throw new BadRequestException('Job must be assigned before starting');
    }

    return this.update(jobId, {
      status: 'in_progress',
      actualStartTime: new Date(),
    });
  }

  async complete(jobId: string, completionData?: Partial<Job>): Promise<Job> {
    const job = await this.findById(jobId);

    if (!['in_progress', 'paused'].includes(job.status)) {
      throw new BadRequestException('Job must be in progress or paused to complete');
    }

    const actualEndTime = new Date();
    const actualDurationMinutes = job.actualStartTime
      ? Math.round((actualEndTime.getTime() - job.actualStartTime.getTime()) / 60000)
      : undefined;

    return this.update(jobId, {
      status: 'completed',
      actualEndTime,
      actualDurationMinutes,
      completedAt: actualEndTime,
      ...completionData,
    });
  }

  async pause(jobId: string): Promise<Job> {
    const job = await this.findById(jobId);

    if (job.status !== 'in_progress') {
      throw new BadRequestException('Only in-progress jobs can be paused');
    }

    return this.update(jobId, { status: 'paused' });
  }

  async resume(jobId: string): Promise<Job> {
    const job = await this.findById(jobId);

    if (job.status !== 'paused') {
      throw new BadRequestException('Only paused jobs can be resumed');
    }

    return this.update(jobId, { status: 'in_progress' });
  }

  async cancel(jobId: string, reason?: string): Promise<Job> {
    const job = await this.findById(jobId);

    if (['completed', 'cancelled'].includes(job.status)) {
      throw new BadRequestException('Cannot cancel completed or already cancelled jobs');
    }

    return this.update(jobId, {
      status: 'cancelled',
      notes: `${job.notes || ''}\n[CANCELLED] ${reason || 'No reason provided'}`,
    });
  }

  async delete(id: string): Promise<void> {
    await this.jobsRepository.softDelete(id);
  }

  async getDispatchBoard(organizationId: string, date: Date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const jobs = await this.findByDateRange(organizationId, startDate, endDate);

    return {
      date: date.toISOString().split('T')[0],
      jobs,
      summary: {
        total: jobs.length,
        pending: jobs.filter((j) => j.status === 'pending').length,
        assigned: jobs.filter((j) => j.status === 'assigned').length,
        inProgress: jobs.filter((j) => j.status === 'in_progress').length,
        completed: jobs.filter((j) => j.status === 'completed').length,
      },
    };
  }

  async checkSLA(jobId: string): Promise<{ isOverdue: boolean; hoursRemaining: number }> {
    const job = await this.findById(jobId);

    if (job.status === 'completed') {
      return { isOverdue: false, hoursRemaining: 0 };
    }

    if (!job.slaDeadline) {
      return { isOverdue: false, hoursRemaining: -1 };
    }

    const now = new Date();
    const deadline = new Date(job.slaDeadline);
    const isOverdue = now > deadline;
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    return { isOverdue, hoursRemaining: Math.max(0, Math.round(hoursRemaining * 100) / 100) };
  }
}
