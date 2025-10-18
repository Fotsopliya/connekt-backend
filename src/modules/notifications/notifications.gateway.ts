import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationsService: NotificationsService) {}

  handleConnection(client: Socket) {
    const extlId = client.handshake.query.extlId as string | undefined;
    if (extlId) {
      client.join(`user:${extlId}`);
    }
    this.notificationsService.setServer(this.server);
  }

  handleDisconnect(client: Socket) {
    const extlId = client.handshake.query.extlId as string | undefined;
    if (extlId) {
      client.leave(`user:${extlId}`);
    }
  }
}
