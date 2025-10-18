import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VerificationRequest } from '../../verification/entities/verification-request.entity';

@Entity({ name: 'vehicles' })
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.vehicles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  owner: User;

  @Column({ type: 'varchar' })
  brand: string;

  @Column({ type: 'varchar' })
  model: string;

  @Column({ name: 'plate_number', type: 'varchar', unique: true })
  plateNumber: string;

  @Column({ type: 'varchar', nullable: true })
  color: string | null;

  @Column({ type: 'int', default: 4 })
  seats: number;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => VerificationRequest, (vr) => vr.vehicle)
  verificationRequests: VerificationRequest[];
}
