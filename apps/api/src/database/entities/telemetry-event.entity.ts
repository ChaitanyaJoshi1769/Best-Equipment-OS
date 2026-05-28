import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Organization } from './organization.entity';

@Entity('telemetry_events')
@Index(['vehicleId'])
@Index(['organizationId'])
@Index(['eventType'])
@Index(['receivedAt'])
@Index(['eventTimestamp'])
@Index(['vehicleId', 'eventTimestamp'], { where: '"vehicleId" IS NOT NULL' })
export class TelemetryEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 50 })
  eventType: string; // 'location', 'fuel', 'engine_hours', 'speed', 'idle', etc.

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fuelLevel: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  engineHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  odometer: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  engineTemp: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  batteryVoltage: number;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>; // Additional provider-specific data

  @CreateDateColumn()
  receivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  eventTimestamp: Date;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.telemetryEvents, {
    onDelete: 'CASCADE',
  })
  vehicle: Vehicle;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;
}
