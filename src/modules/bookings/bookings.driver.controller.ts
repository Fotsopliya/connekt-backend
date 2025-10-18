import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { NotBlockedGuard } from '../../common/guards/not-blocked.guard';
import { VerifiedGuard } from '../../common/guards/verified.guard';
import type { RequestWithUser } from '../../common/types/request-with-user';
import { BookingsService } from './bookings.service';
import { UsersService } from '../users/users.service';
import { SetBookingStatusDto } from './dto/set-booking-status.dto';
import { DriverBookingsQueryDto } from './dto/driver-bookings-query.dto';

@ApiTags('driver/bookings')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, NotBlockedGuard, VerifiedGuard)
@Controller('driver/bookings')
export class BookingsDriverController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly usersService: UsersService,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    return req.user?.extlId || (req.headers['x-extl-id'] as string);
  }

  @Get()
  @ApiQuery({ name: 'tripId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of bookings for driver' })
  async list(
    @Req() req: RequestWithUser,
    @Query() query: DriverBookingsQueryDto,
  ) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);
    return this.bookingsService.driverList(
      driver.id,
      query.tripId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Patch(':id/accept')
  async accept(@Req() req: RequestWithUser, @Param('id') id: string) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);
    return this.bookingsService.driverSetDecision(id, driver.id, 'accepted');
  }

  @Patch(':id/reject')
  async reject(@Req() req: RequestWithUser, @Param('id') id: string) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);
    return this.bookingsService.driverSetDecision(id, driver.id, 'rejected');
  }

  @Patch(':id/status')
  async setStatus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: SetBookingStatusDto,
  ) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);
    return this.bookingsService.setStatus(id, driver.id, body.status);
  }
}
