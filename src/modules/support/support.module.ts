import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportService } from './support.service';
import { SupportAdminController } from './support.admin.controller';
import { SupportUserController } from './support.user.controller';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [SupportAdminController, SupportUserController],
  providers: [SupportService, ExtlAuthGuard],
  exports: [TypeOrmModule, SupportService],
})
export class SupportModule {}
