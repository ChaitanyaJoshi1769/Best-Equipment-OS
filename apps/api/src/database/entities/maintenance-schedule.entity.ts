import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Vehicle } from './vehicle.entity';

@Entity('maintenance_schedules')
@Index(['organizationId', 'vehicleId'])
@Index(['nextDueDate'])
@Index(['status'])
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @Column({ type: 'varchar', length: 100 })
  maintenanceType: string; // e.g., 'oil_change', 'tire_rotation', 'inspection'

  @Column({ type: 'varchar', length: 50, nullable: true })
  frequencyType: 'days' | 'months' | 'hours' | 'miles';

  @Column({ type: 'int', nullable: true })
  frequencyValue: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCompletedAt: Date;

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  nextDueEngineHours: number;

  @Column({ type: 'int', nullable: true })
  nextDueMiles: number;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'inactive' | 'completed';

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: '{}' })
  estimatedCost: {
    parts: number;
    labor: number;
    total: number;
  };

  @Column({ type: 'varchar', nullable: true })
  category: string; // 'preventive', 'corrective', 'emergency'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  vehicle: Vehicle;

  // Helper methods
  isDue(): boolean {
    if (!this.nextDueDate) return false;
    return new Date() >= new Date(this.nextDueDate);
  }

  daysUntilDue(): number {
    if (!this.nextDueDate) return -1;
    const diff = new Date(this.nextDueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getFrequencyDescription(): string {
    if (!this.frequencyType || !this.frequencyValue) return 'Not set';
    const unit = `${this.frequencyType}${this.frequencyValue > 1 ? 's' : ''}`;
    return `Every ${this.frequencyValue} ${unit}`;
  }
}
