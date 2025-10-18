import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ExtlAuthGuard } from '../../common/guards/extl-auth.guard';
import { MessagesService } from './messages.service';
import { ModerateMessageDto } from './dto/moderate-message.dto';

@ApiTags('admin/messages')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, AdminGuard)
@Controller('admin/messages')
export class MessagesAdminController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  list(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.messagesService.list(parseInt(page, 10), parseInt(limit, 10));
  }

  @Patch(':id/moderate')
  moderate(@Param('id') id: string, @Body() body: ModerateMessageDto) {
    return this.messagesService.moderate(id, body.moderated);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
