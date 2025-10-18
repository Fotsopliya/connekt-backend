import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotBlockedGuard } from '../../common/guards/not-blocked.guard';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationRequest } from '../verification/entities/verification-request.entity';
import type { RequestWithUser } from '../../common/types/request-with-user';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    @InjectRepository(VerificationRequest)
    private readonly vrRepo: Repository<VerificationRequest>,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    return req.user?.extlId || (req.headers['x-extl-id'] as string);
  }

  @Post()
  @UseGuards(ExtlAuthGuard, NotBlockedGuard)
  create(@Req() req: RequestWithUser, @Body() dto: CreateVehicleDto) {
    const extlId = this.getExtlId(req);
    return this.vehiclesService.createForUser(extlId, dto);
  }

  @Get('mine')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard)
  listMine(@Req() req: RequestWithUser) {
    const extlId = this.getExtlId(req);
    return this.vehiclesService.listMine(extlId);
  }

  @Post(':id/kyc')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard)
  async requestKyc(
    @Req() req: RequestWithUser,
    @Param('id') vehicleId: string,
  ) {
    const extlId = this.getExtlId(req);
    // ensure vehicle belongs to user via service list/ownership check
    const mine = await this.vehiclesService.listMine(extlId);
    const vehicle = mine.find((v) => v.id === vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found or not owned by user');
    }
    const vr = this.vrRepo.create({
      user: mine[0].owner,
      vehicle,
      type: 'VEHICLE',
      status: 'pending',
    });
    await this.vrRepo.save(vr);
    return { ok: true, requestId: vr.id };
  }

  @Delete(':id')
  @UseGuards(ExtlAuthGuard, NotBlockedGuard)
  async remove(@Req() req: RequestWithUser, @Param('id') vehicleId: string) {
    const extlId = this.getExtlId(req);
    return this.vehiclesService.removeIfOwner(vehicleId, extlId);
  }
}
