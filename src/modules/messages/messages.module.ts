import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { MessagesAdminController } from './messages.admin.controller';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Trip } from '../trips/entities/trip.entity';
import { MessagesUserController } from './messages.user.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Trip]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [MessagesAdminController, MessagesUserController],
  providers: [MessagesService, ExtlAuthGuard],
  exports: [TypeOrmModule, MessagesService],
})
export class MessagesModule {}
