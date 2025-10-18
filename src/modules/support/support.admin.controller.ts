import {
  Body,
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
import { SupportService } from './support.service';

@ApiTags('admin/support')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, AdminGuard)
@Controller('admin/support')
export class SupportAdminController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.supportService.listAll(parseInt(page, 10), parseInt(limit, 10));
  }

  @Patch('tickets/:id/reply')
  reply(@Param('id') id: string, @Body() body: { reply: string }) {
    return this.supportService.reply(id, body.reply);
  }

  @Patch('tickets/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body() body: { status: 'open' | 'in_progress' | 'resolved' | 'closed' },
  ) {
    return this.supportService.setStatus(id, body.status);
  }
}
