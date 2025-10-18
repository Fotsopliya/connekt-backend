import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { TripsService } from './trips.service';

@ApiTags('admin/trips')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, AdminGuard)
@Controller('admin/trips')
export class TripsAdminController {
  constructor(private readonly tripsService: TripsService) {}

  @Patch(':id/validate')
  validate(@Param('id') id: string) {
    return this.tripsService.setValidated(id, true);
  }

  @Patch(':id/unvalidate')
  unvalidate(@Param('id') id: string) {
    return this.tripsService.setValidated(id, false);
  }

  @Get()
  listByValidated(@Query('validated') validated?: string) {
    if (validated === undefined) return this.tripsService.listByValidated(true);
    const flag =
      validated === 'true' ? true : validated === 'false' ? false : true;
    return this.tripsService.listByValidated(flag);
  }
}
