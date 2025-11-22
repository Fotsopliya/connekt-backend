import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Trip)
    private readonly tripsRepo: Repository<Trip>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(passengerId: string, tripId: string, seats = 1) {
    return this.bookingsRepo.manager.transaction(async (mgr) => {
      const trip = await mgr
        .getRepository(Trip)
        .createQueryBuilder('trip')
        .leftJoinAndSelect('trip.driver', 'driver')
        .leftJoinAndSelect('trip.vehicle', 'vehicle')
        .setLock('pessimistic_write')
        .where('trip.id = :id', { id: tripId })
        .getOne();
      if (!trip) throw new NotFoundException('Trip not found');
      if (!trip.validated) throw new ForbiddenException('Trip not validated');

      const passenger = await mgr
        .getRepository(User)
        .findOne({ where: { id: passengerId } });
      if (!passenger) throw new NotFoundException('Passenger not found');

      // Prevent multiple active bookings (pending/accepted) by same passenger on same trip
      const existing = await mgr
        .getRepository(Booking)
        .createQueryBuilder('b')
        .leftJoin('b.trip', 'trip')
        .leftJoin('b.passenger', 'passenger')
        .where('trip.id = :tripId', { tripId })
        .andWhere('passenger.id = :passengerId', { passengerId })
        .andWhere("b.status IN ('pending','accepted')")
        .getOne();
      if (existing)
        throw new ForbiddenException('Already booked for this trip');

      // Seats check at request time (informative). Seats are decremented on accept.
      if (trip.seatsLeft < seats)
        throw new ForbiddenException('Not enough seats');

      const booking = mgr.getRepository(Booking).create({
        trip,
        passenger,
        seats,
        status: 'pending',
      });
      const saved = await mgr.getRepository(Booking).save(booking);
      // Notify driver about new booking request
      this.notifications.emitToUser(trip.driver.extlId, 'booking:new', {
        id: saved.id,
        tripId: trip.id,
        passengerId: passenger.id,
        seats: saved.seats,
        status: saved.status,
      });
      return saved;
    });
  }

  async listMine(passengerId: string, page = 1, limit = 20) {
    return this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.trip', 'trip')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('b.passenger', 'passenger')
      .where('passenger.id = :passengerId', { passengerId })
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async cancel(id: string, passengerId: string) {
    return this.bookingsRepo.manager.transaction(async (mgr) => {
      const booking = await mgr
        .getRepository(Booking)
        .findOne({ where: { id }, relations: ['passenger', 'trip'] });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.passenger.id !== passengerId)
        throw new ForbiddenException('Not allowed');

      // Lock trip row to safely adjust seats
      const trip = await mgr
        .getRepository(Trip)
        .createQueryBuilder('trip')
        .setLock('pessimistic_write')
        .where('trip.id = :id', { id: booking.trip.id })
        .getOne();
      if (!trip) throw new NotFoundException('Trip not found');

      // If previously accepted, restore seats
      if (booking.status === 'accepted') {
        trip.seatsLeft += booking.seats;
        await mgr.getRepository(Trip).save(trip);
      }

      // If already completed/no_show/cancelled, forbid repeated cancel
      if (
        booking.status === 'completed' ||
        booking.status === 'no_show' ||
        booking.status === 'cancelled'
      ) {
        throw new ForbiddenException('Invalid state transition');
      }

      booking.status = 'cancelled';
      const saved = await mgr.getRepository(Booking).save(booking);
      // Notify driver about cancellation
      const driver = await mgr
        .getRepository(User)
        .createQueryBuilder('u')
        .where('u.id = :id', {
          id: trip.id
            ? booking.trip.driver?.id
            : (booking.trip as unknown as { driverId: string }).driverId,
        })
        .getOne();
      if (driver) {
        this.notifications.emitToUser(driver.extlId, 'booking:status', {
          id: saved.id,
          tripId: booking.trip.id,
          status: saved.status,
          seats: saved.seats,
        });
      }
      return { ok: true };
    });
  }

  async driverList(driverId: string, tripId?: string, page = 1, limit = 20) {
    const qb = this.bookingsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.trip', 'trip')
      .leftJoinAndSelect('b.passenger', 'passenger')
      .leftJoin('trip.driver', 'driver')
      .where('driver.id = :driverId', { driverId })
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (tripId) qb.andWhere('trip.id = :tripId', { tripId });
    return qb.getMany();
  }

  async driverSetDecision(
    id: string,
    driverId: string,
    decision: 'accepted' | 'rejected',
  ) {
    return this.bookingsRepo.manager.transaction(async (mgr) => {
      const booking = await mgr
        .getRepository(Booking)
        .findOne({ where: { id }, relations: ['trip', 'trip.driver'] });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.trip.driver.id !== driverId)
        throw new ForbiddenException('Not allowed');

      // Only allow decision from pending
      if (booking.status !== 'pending') {
        throw new ForbiddenException(
          'Only pending bookings can be accepted or rejected',
        );
      }

      // Lock trip row before changing seats/status
      const trip = await mgr
        .getRepository(Trip)
        .createQueryBuilder('trip')
        .setLock('pessimistic_write')
        .where('trip.id = :id', { id: booking.trip.id })
        .getOne();
      if (!trip) throw new NotFoundException('Trip not found');

      if (decision === 'accepted') {
        if (trip.seatsLeft < booking.seats)
          throw new ForbiddenException('Not enough seats');
        trip.seatsLeft -= booking.seats;
        await mgr.getRepository(Trip).save(trip);
      }

      booking.status = decision;
      const saved = await mgr.getRepository(Booking).save(booking);
      // Notify passenger about decision
      const passenger = await mgr
        .getRepository(User)
        .createQueryBuilder('u')
        .where('u.id = :id', { id: saved.passenger.id })
        .getOne();
      if (passenger) {
        this.notifications.emitToUser(passenger.extlId, 'booking:status', {
          id: saved.id,
          tripId: trip.id,
          status: saved.status,
          seats: saved.seats,
        });
      }
      return { ok: true };
    });
  }

  async setStatus(
    id: string,
    requesterId: string,
    status: Extract<BookingStatus, 'completed' | 'no_show'>,
  ) {
    return this.bookingsRepo.manager.transaction(async (mgr) => {
      const booking = await mgr
        .getRepository(Booking)
        .findOne({ where: { id }, relations: ['trip', 'trip.driver'] });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.trip.driver.id !== requesterId)
        throw new ForbiddenException('Only driver can set status');

      // Only allow completing/no_show from accepted
      if (booking.status !== 'accepted') {
        throw new ForbiddenException(
          'Only accepted bookings can be completed or marked no_show',
        );
      }

      booking.status = status;
      const saved = await mgr.getRepository(Booking).save(booking);
      // Notify passenger about final status
      const passenger = await mgr
        .getRepository(User)
        .createQueryBuilder('u')
        .where('u.id = :id', { id: saved.passenger.id })
        .getOne();
      if (passenger) {
        this.notifications.emitToUser(passenger.extlId, 'booking:status', {
          id: saved.id,
          tripId: booking.trip.id,
          status: saved.status,
          seats: saved.seats,
        });
      }
      return { ok: true };
    });
  }
}
