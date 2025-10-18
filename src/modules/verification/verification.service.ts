import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationRequest } from './entities/verification-request.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRequest)
    private readonly vrRepo: Repository<VerificationRequest>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
    private readonly notifications: NotificationsService,
  ) {}

  async listPending(page = 1, limit = 20) {
    return this.vrRepo
      .createQueryBuilder('vr')
      .leftJoinAndSelect('vr.user', 'user')
      .leftJoinAndSelect('vr.vehicle', 'vehicle')
      .where('vr.status = :status', { status: 'pending' })
      .orderBy('vr.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async listMine(userId: string) {
    return this.vrRepo
      .createQueryBuilder('vr')
      .leftJoinAndSelect('vr.user', 'user')
      .leftJoinAndSelect('vr.vehicle', 'vehicle')
      .where('user.id = :userId', { userId })
      .orderBy('vr.createdAt', 'DESC')
      .getMany();
  }

  async approve(id: string, adminId: string, notes?: string) {
    const vr = await this.vrRepo.findOne({
      where: { id },
      relations: ['user', 'vehicle'],
    });
    if (!vr) throw new NotFoundException('Request not found');

    vr.status = 'approved';
    vr.notes = notes ?? vr.notes;
    vr.reviewedAt = new Date();
    vr.reviewedByAdminId = adminId;
    await this.vrRepo.save(vr);

    if (vr.type === 'USER') {
      vr.user.verified = true;
      await this.usersRepo.save(vr.user);
      // Notify user verified
      if (vr.user?.extlId) {
        this.notifications.emitToUser(vr.user.extlId, 'kyc:status', {
          requestId: vr.id,
          type: vr.type,
          status: vr.status,
        });
        this.notifications.emitToUser(vr.user.extlId, 'user:verified', {
          id: vr.user.id,
          verified: true,
        });
      }
    } else if (vr.type === 'VEHICLE' && vr.vehicle) {
      vr.vehicle.verified = true;
      await this.vehiclesRepo.save(vr.vehicle);
      // Notify vehicle owner
      const owner = await this.usersRepo
        .createQueryBuilder('u')
        .leftJoin('u.vehicles', 'v')
        .where('v.id = :vid', { vid: vr.vehicle.id })
        .getOne();
      if (owner?.extlId) {
        this.notifications.emitToUser(owner.extlId, 'kyc:status', {
          requestId: vr.id,
          type: vr.type,
          status: vr.status,
        });
        this.notifications.emitToUser(owner.extlId, 'vehicle:verified', {
          id: vr.vehicle.id,
          verified: true,
        });
      }
    }

    return { ok: true };
  }

  async reject(id: string, adminId: string, notes?: string) {
    const vr = await this.vrRepo.findOne({
      where: { id },
      relations: ['user', 'vehicle'],
    });
    if (!vr) throw new NotFoundException('Request not found');

    vr.status = 'rejected';
    vr.notes = notes ?? vr.notes;
    vr.reviewedAt = new Date();
    vr.reviewedByAdminId = adminId;
    await this.vrRepo.save(vr);
    // Notify
    if (vr.type === 'USER') {
      if (vr.user?.extlId) {
        this.notifications.emitToUser(vr.user.extlId, 'kyc:status', {
          requestId: vr.id,
          type: vr.type,
          status: vr.status,
        });
      }
    } else if (vr.type === 'VEHICLE' && vr.vehicle) {
      const owner = await this.usersRepo
        .createQueryBuilder('u')
        .leftJoin('u.vehicles', 'v')
        .where('v.id = :vid', { vid: vr.vehicle.id })
        .getOne();
      if (owner?.extlId) {
        this.notifications.emitToUser(owner.extlId, 'kyc:status', {
          requestId: vr.id,
          type: vr.type,
          status: vr.status,
        });
      }
    }
    return { ok: true };
  }
}
