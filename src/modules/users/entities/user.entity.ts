import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { VerificationRequest } from '../../verification/entities/verification-request.entity';

export type UserRole = 'user' | 'admin';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extl_id', type: 'varchar', unique: true })
  extlId: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', default: 'user' })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.owner)
  vehicles: Vehicle[];

  @OneToMany(() => VerificationRequest, (vr) => vr.user)
  verificationRequests: VerificationRequest[];
}
