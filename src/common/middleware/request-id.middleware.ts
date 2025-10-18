import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = (req.headers['x-request-id'] as string) || '';
    const reqId = incoming || randomUUID();
    req.requestId = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  }
}
