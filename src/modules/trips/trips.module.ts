import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { TripsService } from './trips.service';
import { TripsAdminController } from './trips.admin.controller';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { UsersModule } from '../users/users.module';
import { TripsController } from './trips.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Vehicle]), UsersModule, NotificationsModule],
  controllers: [TripsAdminController, TripsController],
  providers: [TripsService, ExtlAuthGuard],
  exports: [TypeOrmModule, TripsService],
})
export class TripsModule {}
