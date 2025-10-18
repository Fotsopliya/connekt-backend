import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { VerificationModule } from './modules/verification/verification.module';
import { AuthModule } from './modules/auth/auth.module';
import { TripsModule } from './modules/trips/trips.module';
import { SupportModule } from './modules/support/support.module';
import { MessagesModule } from './modules/messages/messages.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminSeedService } from './bootstrap/admin-seed.service';
import { User } from './modules/users/entities/user.entity';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.test', '.env'] }),
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60000, limit: 60 }] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
    }),
    TypeOrmModule.forFeature([User]),
    NotificationsModule,
    UsersModule,
    VehiclesModule,
    VerificationModule,
    AuthModule,
    TripsModule,
    SupportModule,
    MessagesModule,
    BookingsModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AdminSeedService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
