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
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Job } from '../../database/entities';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  async createJob(@Body() jobData: Partial<Job>): Promise<Job> {
    return this.jobsService.create(jobData);
  }

  @Get('dispatch-board')
  async getDispatchBoard(
    @Query('organizationId') organizationId: string,
    @Query('date') date: string,
  ) {
    const dateObj = new Date(date);
    return this.jobsService.getDispatchBoard(organizationId, dateObj);
  }

  @Get('by-status')
  async getByStatus(
    @Query('organizationId') organizationId: string,
    @Query('status') status: string,
  ): Promise<Job[]> {
    const statuses = status.split(',');
    return this.jobsService.findByStatus(organizationId, statuses);
  }

  @Get('by-technician/:technicianId')
  async getByTechnician(@Param('technicianId') technicianId: string): Promise<Job[]> {
    return this.jobsService.findByTechnician(technicianId);
  }

  @Get('by-organization')
  async getByOrganization(
    @Query('organizationId') organizationId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ) {
    const [jobs, count] = await this.jobsService.findByOrganization(organizationId, skip, take);
    return { data: jobs, total: count, skip, take };
  }

  @Get(':id/sla')
  async checkSLA(@Param('id') jobId: string) {
    return this.jobsService.checkSLA(jobId);
  }

  @Get(':id')
  async getJob(@Param('id') id: string): Promise<Job> {
    return this.jobsService.findById(id);
  }

  @Patch(':id')
  async updateJob(
    @Param('id') id: string,
    @Body() jobData: Partial<Job>,
  ): Promise<Job> {
    return this.jobsService.update(id, jobData);
  }

  @Post(':id/assign')
  async assignJob(
    @Param('id') jobId: string,
    @Body('technicianId') technicianId: string,
  ): Promise<Job> {
    return this.jobsService.assign(jobId, technicianId);
  }

  @Post(':id/start')
  async startJob(@Param('id') jobId: string): Promise<Job> {
    return this.jobsService.start(jobId);
  }

  @Post(':id/complete')
  async completeJob(
    @Param('id') jobId: string,
    @Body() completionData?: Partial<Job>,
  ): Promise<Job> {
    return this.jobsService.complete(jobId, completionData);
  }

  @Post(':id/pause')
  async pauseJob(@Param('id') jobId: string): Promise<Job> {
    return this.jobsService.pause(jobId);
  }

  @Post(':id/resume')
  async resumeJob(@Param('id') jobId: string): Promise<Job> {
    return this.jobsService.resume(jobId);
  }

  @Post(':id/cancel')
  async cancelJob(
    @Param('id') jobId: string,
    @Body('reason') reason?: string,
  ): Promise<Job> {
    return this.jobsService.cancel(jobId, reason);
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string): Promise<void> {
    return this.jobsService.delete(id);
  }
}
