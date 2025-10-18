import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity({ name: 'trips' })
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  driver: User;

  @ManyToOne(() => Vehicle, { nullable: false, onDelete: 'RESTRICT' })
  vehicle: Vehicle;

  @Column({ name: 'departure_city', type: 'varchar' })
  departureCity: string;

  @Column({ name: 'arrival_city', type: 'varchar' })
  arrivalCity: string;

  @Column({ name: 'departure_time', type: 'timestamp' })
  departureTime: Date;

  @Column({ name: 'seats_total', type: 'int', default: 4 })
  seatsTotal: number;

  @Column({ name: 'seats_left', type: 'int', default: 4 })
  seatsLeft: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  price: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  validated: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
