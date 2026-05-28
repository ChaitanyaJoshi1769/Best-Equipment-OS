import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

export interface Permission {
  resource: string;
  actions: string[];
}

@Entity('roles')
@Index(['organizationId', 'name'], { unique: true })
@Index(['organizationId'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'inactive';

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', default: '[]' })
  permissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization, (org) => org.roles, {
    onDelete: 'CASCADE',
  })
  organization: Organization;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  // Helper method
  hasPermission(resource: string, action: string): boolean {
    return this.permissions.some(
      (perm) => perm.resource === resource && perm.actions.includes(action),
    );
  }
}
