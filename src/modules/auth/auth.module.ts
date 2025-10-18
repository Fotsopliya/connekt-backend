import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClerkWebhookController } from './clerk.controller';
import { ClerkWebhookService } from './clerk.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule],
  controllers: [ClerkWebhookController],
  providers: [ClerkWebhookService],
})
export class AuthModule {}
