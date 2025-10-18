import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Trip } from '../trips/entities/trip.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Trip)
    private readonly tripsRepo: Repository<Trip>,
    private readonly notifications: NotificationsService,
  ) {}

  async list(page = 1, limit = 50) {
    return this.messagesRepo.find({
      relations: ['trip', 'sender', 'recipient'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async moderate(id: string, moderated: boolean) {
    const msg = await this.messagesRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    msg.moderated = moderated;
    await this.messagesRepo.save(msg);
    return { ok: true };
  }

  async remove(id: string) {
    const msg = await this.messagesRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    await this.messagesRepo.remove(msg);
    return { ok: true };
  }

  async send(
    senderId: string,
    recipientId: string,
    tripId: string,
    content: string,
  ) {
    const [sender, recipient, trip] = await Promise.all([
      this.usersRepo.findOne({ where: { id: senderId } }),
      this.usersRepo.findOne({ where: { id: recipientId } }),
      this.tripsRepo.findOne({ where: { id: tripId } }),
    ]);
    if (!sender || !recipient || !trip)
      throw new NotFoundException('Invalid sender/recipient/trip');
    const msg = this.messagesRepo.create({
      sender,
      recipient,
      trip,
      content,
      isRead: false,
      moderated: false,
    });
    const saved = await this.messagesRepo.save(msg);
    this.notifications.emitToUser(recipient.extlId, 'message:new', {
      id: saved.id,
      tripId: trip.id,
      senderId: sender.id,
      content: saved.content,
      createdAt: saved.createdAt,
    });
    return saved;
  }

  async listConversation(userId: string, withUserId: string, tripId: string) {
    return this.messagesRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.recipient', 'recipient')
      .leftJoinAndSelect('m.trip', 'trip')
      .where(
        '(sender.id = :userId AND recipient.id = :withUserId) OR (sender.id = :withUserId AND recipient.id = :userId)',
        {
          userId,
          withUserId,
        },
      )
      .andWhere('trip.id = :tripId', { tripId })
      .orderBy('m.createdAt', 'ASC')
      .getMany();
  }

  async listInbox(userId: string, page = 1, limit = 20) {
    return this.messagesRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.recipient', 'recipient')
      .leftJoinAndSelect('m.trip', 'trip')
      .where('recipient.id = :userId', { userId })
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async listSent(userId: string, page = 1, limit = 20) {
    return this.messagesRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.recipient', 'recipient')
      .leftJoinAndSelect('m.trip', 'trip')
      .where('sender.id = :userId', { userId })
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async markRead(id: string, userId: string) {
    const msg = await this.messagesRepo.findOne({
      where: { id },
      relations: ['recipient'],
    });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.recipient.id !== userId)
      throw new ForbiddenException('Only recipient can mark read');
    msg.isRead = true;
    await this.messagesRepo.save(msg);
    return { ok: true };
  }
}
