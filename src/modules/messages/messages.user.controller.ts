import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
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
import type { RequestWithUser } from '../../common/types/request-with-user';
import { UsersService } from '../users/users.service';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(ExtlAuthGuard, NotBlockedGuard)
@Controller('messages')
export class MessagesUserController {
  constructor(
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
  ) {}

  private getExtlId(req: RequestWithUser): string {
    return req.user?.extlId || (req.headers['x-extl-id'] as string);
  }

  @Post()
  async send(@Req() req: RequestWithUser, @Body() body: SendMessageDto) {
    const extlId = this.getExtlId(req);
    const sender = await this.usersService.getByExtlId(extlId);
    return this.messagesService.send(
      sender.id,
      body.recipientId,
      body.tripId,
      body.content,
    );
  }

  @Get('conversation')
  async conversation(
    @Req() req: RequestWithUser,
    @Query('with') withUserId: string,
    @Query('tripId') tripId: string,
  ) {
    const extlId = this.getExtlId(req);
    const me = await this.usersService.getByExtlId(extlId);
    return this.messagesService.listConversation(me.id, withUserId, tripId);
  }

  @Get('inbox')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of received messages' })
  async inbox(@Req() req: RequestWithUser, @Query() query: PaginationQueryDto) {
    const extlId = this.getExtlId(req);
    const me = await this.usersService.getByExtlId(extlId);
    return this.messagesService.listInbox(
      me.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('sent')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of sent messages' })
  async sent(@Req() req: RequestWithUser, @Query() query: PaginationQueryDto) {
    const extlId = this.getExtlId(req);
    const me = await this.usersService.getByExtlId(extlId);
    return this.messagesService.listSent(
      me.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Patch(':id/read')
  async markRead(@Req() req: RequestWithUser, @Param('id') id: string) {
    const extlId = this.getExtlId(req);
    const me = await this.usersService.getByExtlId(extlId);
    return this.messagesService.markRead(id, me.id);
  }
}
