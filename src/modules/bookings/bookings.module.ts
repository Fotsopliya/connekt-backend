import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsUserController } from './bookings.user.controller';
import { BookingsDriverController } from './bookings.driver.controller';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Trip, User]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [BookingsUserController, BookingsDriverController],
  providers: [BookingsService],
  exports: [TypeOrmModule, BookingsService],
})
export class BookingsModule {}
