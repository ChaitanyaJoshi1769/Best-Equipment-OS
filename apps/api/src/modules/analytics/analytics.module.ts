import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { AdvancedAnalyticsController } from './advanced-analytics.controller';
import { Job } from '../jobs/entities/job.entity';
import { Telemetry } from '../telemetry/entities/telemetry.entity';
import { Maintenance } from '../maintenance/entities/maintenance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Telemetry, Maintenance])],
  providers: [AdvancedAnalyticsService],
  controllers: [AdvancedAnalyticsController],
  exports: [AdvancedAnalyticsService],
})
export class AnalyticsModule {}
