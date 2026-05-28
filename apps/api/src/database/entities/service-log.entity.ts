import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('service_logs')
@Index(['jobId'])
@Index(['organizationId'])
@Index(['technicianId'])
export class ServiceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  technicianId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serviceType: string; // e.g., 'oil_change', 'inspection', 'repair'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: '[]' })
  partsUsed: Array<{
    id: string;
    name: string;
    quantity: number;
    unitCost: number;
  }>;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  laborHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ type: 'text', nullable: true })
  completionSignature: string; // Base64 encoded image

  @Column({ type: 'jsonb', default: '[]' })
  completionImages: Array<{ url: string; caption: string }>;

  @Column({ type: 'varchar', nullable: true })
  weatherConditions: string;

  @Column({ type: 'int', nullable: true })
  mileageAtCompletion: number;

  @Column({ type: 'text', nullable: true })
  nextMaintenanceRecommendation: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Job, (job) => job.serviceLogs, { onDelete: 'CASCADE' })
  job: Job;

  @ManyToOne(() => User)
  technician: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  // Helper method
  getTotalCost(): number {
    const partsCost = (this.partsUsed || []).reduce((sum, part) => {
      return sum + part.quantity * part.unitCost;
    }, 0);
    const laborCost = (this.laborHours || 0) * 100; // Assuming $100/hour
    return Math.round((partsCost + (this.cost || 0) + laborCost) * 100) / 100;
  }
}
