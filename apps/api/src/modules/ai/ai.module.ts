import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { Job } from '../jobs/entities/job.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Telemetry } from '../telemetry/entities/telemetry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Vehicle, Telemetry])],
  providers: [AIService],
  controllers: [AIController],
  exports: [AIService],
})
export class AIModule {}
