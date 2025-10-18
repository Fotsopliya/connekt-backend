import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepo: Repository<Trip>,
    private readonly notifications: NotificationsService,
  ) {}

  async setValidated(id: string, validated: boolean) {
    const trip = await this.tripsRepo.findOne({
      where: { id },
      relations: ['driver', 'vehicle'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    trip.validated = validated;
    await this.tripsRepo.save(trip);
    // Notify driver
    if (trip.driver?.extlId) {
      this.notifications.emitToUser(trip.driver.extlId, 'trip:validated', {
        id: trip.id,
        validated: trip.validated,
      });
    }
    return { ok: true, id: trip.id, validated: trip.validated };
  }

  async create(data: Partial<Trip>) {
    const trip = this.tripsRepo.create(data);
    await this.tripsRepo.save(trip);
    return trip;
  }

  async search(filters: {
    departure_city?: string;
    arrival_city?: string;
    from?: Date;
    to?: Date;
    validated?: boolean;
  }) {
    const qb = this.tripsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.driver', 'driver')
      .leftJoinAndSelect('t.vehicle', 'vehicle')
      .orderBy('t.departure_time', 'ASC');

    if (filters.departure_city)
      qb.andWhere('t.departure_city ILIKE :dc', {
        dc: `%${filters.departure_city}%`,
      });
    if (filters.arrival_city)
      qb.andWhere('t.arrival_city ILIKE :ac', {
        ac: `%${filters.arrival_city}%`,
      });
    if (filters.from)
      qb.andWhere('t.departure_time >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('t.departure_time <= :to', { to: filters.to });
    if (typeof filters.validated === 'boolean')
      qb.andWhere('t.validated = :validated', { validated: filters.validated });

    return qb.getMany();
  }

  async listMine(driverId: string) {
    return this.tripsRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.driver', 'driver')
      .leftJoinAndSelect('t.vehicle', 'vehicle')
      .where('driver.id = :driverId', { driverId })
      .orderBy('t.departure_time', 'ASC')
      .getMany();
  }

  async getById(id: string) {
    const trip = await this.tripsRepo.findOne({
      where: { id },
      relations: ['driver', 'vehicle'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async updateIfOwner(id: string, driverId: string, patch: Partial<Trip>) {
    const trip = await this.tripsRepo.findOne({
      where: { id },
      relations: ['driver', 'vehicle'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.driver.id !== driverId)
      throw new ForbiddenException('Not allowed');
    Object.assign(trip, patch);
    await this.tripsRepo.save(trip);
    return trip;
  }

  async removeIfOwner(id: string, driverId: string) {
    const trip = await this.tripsRepo.findOne({
      where: { id },
      relations: ['driver'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.driver.id !== driverId)
      throw new ForbiddenException('Not allowed');
    await this.tripsRepo.remove(trip);
    return { ok: true };
  }

  async listByValidated(validated: boolean) {
    return this.tripsRepo.find({
      where: { validated } as FindOptionsWhere<Trip>,
      relations: ['driver', 'vehicle'],
    });
  }
}
