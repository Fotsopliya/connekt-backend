import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { NotBlockedGuard } from '../../common/guards/not-blocked.guard';
import { VerifiedGuard } from '../../common/guards/verified.guard';
import type { RequestWithUser } from '../../common/types/request-with-user';
import { TripsService } from './trips.service';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip } from './entities/trip.entity';

@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly usersService: UsersService,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    return req.user?.extlId || (req.headers['x-extl-id'] as string);
  }

  @Post()
  @UseGuards(ExtlAuthGuard, NotBlockedGuard, VerifiedGuard)
  async create(@Req() req: RequestWithUser, @Body() dto: CreateTripDto) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);

    const vehicle = await this.vehiclesRepo.findOne({
      where: { id: dto.vehicleId },
      relations: ['owner'],
    });
    if (!vehicle || vehicle.owner.id !== driver.id || !vehicle.verified) {
      throw new Error('Vehicle not found, not verified, or not owned by user');
    }

    return this.tripsService.create({
      driver,
      vehicle,
      departureCity: dto.departureCity,
      arrivalCity: dto.arrivalCity,
      departureTime: new Date(dto.departureTime),
      seatsTotal: dto.seatsTotal,
      seatsLeft: dto.seatsLeft,
      price: String(dto.price),
      description: dto.description ?? null,
      validated: false,
    });
  }

  @Get()
  search(
    @Query('departure_city') departure_city?: string,
    @Query('arrival_city') arrival_city?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tripsService.search({
      departure_city,
      arrival_city,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      validated: true,
    });
  }

  @Get('mine')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard, VerifiedGuard)
  async listMine(@Req() req: RequestWithUser) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);
    return this.tripsService.listMine(driver.id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.tripsService.getById(id);
  }

  @Patch(':id')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard, VerifiedGuard)
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
  ) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);
    const patch: Partial<Trip> = {};
    if (dto.departureCity !== undefined)
      patch.departureCity = dto.departureCity;
    if (dto.arrivalCity !== undefined) patch.arrivalCity = dto.arrivalCity;
    if (dto.departureTime !== undefined)
      patch.departureTime = new Date(dto.departureTime);
    if (dto.seatsTotal !== undefined) patch.seatsTotal = dto.seatsTotal;
    if (dto.seatsLeft !== undefined) patch.seatsLeft = dto.seatsLeft;
    if (dto.price !== undefined) patch.price = String(dto.price);
    if (dto.description !== undefined)
      patch.description = dto.description ?? null;
    return this.tripsService.updateIfOwner(id, driver.id, patch);
  }

  @Delete(':id')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard, VerifiedGuard)
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const extlId = this.getExtlId(req);
    const driver = await this.usersService.getByExtlId(extlId);
    return this.tripsService.removeIfOwner(id, driver.id);
  }
}
