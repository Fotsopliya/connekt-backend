import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

@Entity({ name: 'support_tickets' })
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', default: 'open' })
  status: SupportStatus;

  @Column({ name: 'admin_reply', type: 'text', nullable: true })
  adminReply: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
