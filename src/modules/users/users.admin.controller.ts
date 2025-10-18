import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { UsersService } from './users.service';
import { VehiclesService } from '../vehicles/vehicles.service';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, AdminGuard)
@Controller('admin/users')
export class UsersAdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Patch(':id/block')
  block(@Param('id') id: string) {
    return this.usersService.setBlocked(id, true);
  }

  @Patch(':id/unblock')
  unblock(@Param('id') id: string) {
    return this.usersService.setBlocked(id, false);
  }

  @Get(':id/vehicles')
  listUserVehicles(@Param('id') id: string) {
    return this.vehiclesService.listByUserId(id);
  }
}
