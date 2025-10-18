import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationRequest } from './entities/verification-request.entity';
import { VerificationService } from './verification.service';
import { VerificationAdminController } from './verificationAdmin.controller';
import { VerificationUserController } from './verification.user.controller';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { UsersModule } from '../users/users.module';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationRequest, User, Vehicle]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [VerificationAdminController, VerificationUserController],
  providers: [VerificationService, ExtlAuthGuard],
  exports: [TypeOrmModule, VerificationService],
})
export class VerificationModule {}
