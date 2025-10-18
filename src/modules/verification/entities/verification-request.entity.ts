import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

export type VerificationType = 'USER' | 'VEHICLE';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

@Entity({ name: 'verification_requests' })
export class VerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.verificationRequests, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.verificationRequests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  vehicle: Vehicle | null;

  @Column({ type: 'varchar' })
  type: VerificationType;

  @Column({ type: 'varchar', default: 'pending' })
  status: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'reviewed_by_admin_id', type: 'uuid', nullable: true })
  reviewedByAdminId: string | null;
}
