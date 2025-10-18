import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  broadcast(@Body() body: { event: string; payload: any }) {
    this.notificationsService.broadcast(body.event, body.payload);
    return { ok: true };
  }

  @Post('user')
  toUser(@Body() body: { extlId: string; event: string; payload: any }) {
    this.notificationsService.emitToUser(body.extlId, body.event, body.payload);
    return { ok: true };
  }
}
