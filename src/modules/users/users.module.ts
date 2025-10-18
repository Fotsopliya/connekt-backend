import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { VerificationRequest } from '../verification/entities/verification-request.entity';
import { UsersAdminController } from './users.admin.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerificationRequest]),
    forwardRef(() => VehiclesModule),
  ],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService, ExtlAuthGuard],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
