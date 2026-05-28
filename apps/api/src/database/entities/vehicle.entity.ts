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
import { User } from './user.entity';
import { Job } from './job.entity';
import { TelemetryEvent } from './telemetry-event.entity';

@Entity('vehicles')
@Index(['organizationId'])
@Index(['status'])
@Index(['assetId'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  assetId: string;

  @Column({ type: 'varchar', length: 17, nullable: true })
  vin: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  make: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  licensePlate: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleType: string; // truck, van, equipment, etc.

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'inactive' | 'maintenance' | 'retired';

  @Column({ type: 'geography', nullable: true })
  location: string; // POINT(lat, lon)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentFuel: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  engineHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  odometerReading: number;

  @Column({ type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ type: 'date', nullable: true })
  lastServiceDate: Date;

  @Column({ type: 'date', nullable: true })
  nextServiceDate: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedTechnicianId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @ManyToOne(() => User, { nullable: true })
  assignedTechnician: User;

  @OneToMany(() => Job, (job) => job.vehicle)
  jobs: Job[];

  @OneToMany(() => TelemetryEvent, (telemetry) => telemetry.vehicle)
  telemetryEvents: TelemetryEvent[];

  // Helper method
  isDueForMaintenance(): boolean {
    if (!this.nextServiceDate) return false;
    return new Date() >= new Date(this.nextServiceDate);
  }
}
