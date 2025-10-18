import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../../trips/entities/trip.entity';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, { nullable: false, onDelete: 'CASCADE' })
  trip: Trip;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  sender: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  recipient: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'moderated', type: 'boolean', default: false })
  moderated: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
