import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { User } from '../users/entities/user.entity';
import { VerificationRequest } from '../verification/entities/verification-request.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, User, VerificationRequest]),
    forwardRef(() => UsersModule),
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [TypeOrmModule, VehiclesService],
})
export class VehiclesModule {}
