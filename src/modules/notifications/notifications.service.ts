import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(extlId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Socket server not initialized yet');
      return;
    }
    this.server.to(`user:${extlId}`).emit(event, payload);
  }

  broadcast(event: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Socket server not initialized yet');
      return;
    }
    this.server.emit(event, payload);
  }
}
