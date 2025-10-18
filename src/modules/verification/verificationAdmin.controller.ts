import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { VerificationService } from './verification.service';
import type { RequestWithUser } from '../../common/types/request-with-user';

@ApiTags('admin/verification')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, AdminGuard)
@Controller('admin/verification')
export class VerificationAdminController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('requests')
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.verificationService.listPending(
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Patch(':id/approve')
  approve(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    if (!req.user) throw new UnauthorizedException('Unauthorized');
    const adminId = req.user.id as string;
    return this.verificationService.approve(id, adminId, body?.notes);
  }

  @Patch(':id/reject')
  reject(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    if (!req.user) throw new UnauthorizedException('Unauthorized');
    const adminId = req.user.id as string;
    return this.verificationService.reject(id, adminId, body?.notes);
  }
}
