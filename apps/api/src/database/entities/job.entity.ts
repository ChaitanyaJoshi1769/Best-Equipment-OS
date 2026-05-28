import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Vehicle } from './vehicle.entity';
import { User } from './user.entity';
import { ServiceLog } from './service-log.entity';

@Entity('jobs')
@Index(['organizationId', 'scheduledDate', 'status'])
@Index(['organizationId', 'status'])
@Index(['assignedTechnicianId'])
@Index(['vehicleId'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  jobNumber: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  vehicleId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string; // Future: external customer reference

  @Column({ type: 'uuid', nullable: true })
  assignedTechnicianId: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

  @Column({ type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'time', nullable: true })
  scheduledStartTime: string;

  @Column({ type: 'time', nullable: true })
  scheduledEndTime: string;

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime: Date;

  @Column({ type: 'int', nullable: true })
  estimatedDurationMinutes: number;

  @Column({ type: 'int', nullable: true })
  actualDurationMinutes: number;

  @Column({ type: 'geography', nullable: true })
  location: string; // POINT(lat, lon)

  @Column({ type: 'varchar', length: 50, nullable: true })
  jobType: string; // 'maintenance', 'repair', 'inspection', etc.

  @Column({ type: 'timestamp', nullable: true })
  slaDeadline: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: '[]' })
  attachments: Array<{ url: string; name: string; type: string }>;

  @Column({ type: 'jsonb', default: '{}' })
  customFields: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.jobs, { nullable: true })
  vehicle: Vehicle;

  @ManyToOne(() => User, { nullable: true })
  assignedTechnician: User;

  @OneToMany(() => ServiceLog, (log) => log.job)
  serviceLogs: ServiceLog[];

  // Helper methods
  isOverdue(): boolean {
    if (!this.slaDeadline) return false;
    if (this.status === 'completed') return false;
    return new Date() > new Date(this.slaDeadline);
  }

  getDurationHours(): number {
    if (!this.actualDurationMinutes) return 0;
    return Math.round((this.actualDurationMinutes / 60) * 100) / 100;
  }
}
