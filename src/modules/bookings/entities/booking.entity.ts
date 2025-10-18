import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'no_show';

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, { nullable: false, onDelete: 'CASCADE' })
  trip: Trip;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  passenger: User;

  @Column({ type: 'int', default: 1 })
  seats: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: BookingStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
