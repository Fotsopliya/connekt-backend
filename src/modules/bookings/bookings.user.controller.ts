import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UseInterceptors } from '@nestjs/common';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, NotBlockedGuard, VerifiedGuard)
@Controller('bookings')
export class BookingsUserController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly usersService: UsersService,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    return req.user?.extlId || (req.headers['x-extl-id'] as string);
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  async create(@Req() req: RequestWithUser, @Body() dto: CreateBookingDto) {
    const extlId = this.getExtlId(req);
    const passenger = await this.usersService.getByExtlId(extlId);
    return this.bookingsService.create(
      passenger.id,
      dto.tripId,
      dto.seats ?? 1,
    );
  }

  @Get('mine')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of my bookings' })
  async listMine(
    @Req() req: RequestWithUser,
    @Query() query: PaginationQueryDto,
  ) {
    const extlId = this.getExtlId(req);
    const passenger = await this.usersService.getByExtlId(extlId);
    return this.bookingsService.listMine(
      passenger.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Delete(':id')
  async cancel(@Req() req: RequestWithUser, @Param('id') id: string) {
    const extlId = this.getExtlId(req);
    const passenger = await this.usersService.getByExtlId(extlId);
    return this.bookingsService.cancel(id, passenger.id);
  }
}
