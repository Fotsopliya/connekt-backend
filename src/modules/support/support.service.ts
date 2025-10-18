import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportRepo: Repository<SupportTicket>,
    private readonly notifications: NotificationsService,
  ) {}

  async listAll(page = 1, limit = 20) {
    return this.supportRepo.find({
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async reply(id: string, reply: string) {
    const t = await this.supportRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Ticket not found');
    t.adminReply = reply;
    t.status = 'in_progress';
    await this.supportRepo.save(t);
    // Notify ticket owner
    const owner = await this.supportRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.id = :id', { id })
      .getOne();
    if (owner?.user) {
      this.notifications.emitToUser(owner.user.extlId, 'ticket:reply', {
        id: t.id,
      });
    }
    return { ok: true };
  }

  async setStatus(
    id: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
  ) {
    const t = await this.supportRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Ticket not found');
    t.status = status;
    await this.supportRepo.save(t);
    // Notify ticket owner
    const owner = await this.supportRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.id = :id', { id })
      .getOne();
    if (owner?.user) {
      this.notifications.emitToUser(owner.user.extlId, 'ticket:status', {
        id: t.id,
        status: t.status,
      });
    }
    return { ok: true };
  }

  async create(user: User, subject: string, content: string) {
    const t = this.supportRepo.create({
      user,
      subject,
      content,
      status: 'open',
    });
    await this.supportRepo.save(t);
    return t;
  }

  async listMine(userId: string, page = 1, limit = 20) {
    return this.supportRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.userId = :userId', { userId })
      .orderBy('t.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async deleteIfOwner(id: string, userId: string) {
    const t = await this.supportRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!t) throw new NotFoundException('Ticket not found');
    if (t.user.id !== userId) throw new ForbiddenException('Not allowed');
    await this.supportRepo.remove(t);
    return { ok: true };
  }
}
