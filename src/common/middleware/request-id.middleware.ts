import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { Request, Response, NextFunction } from 'express';

interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const incoming = (req.headers['x-request-id'] as string) || '';
    const reqId = incoming || randomUUID();
    req.requestId = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  }
}
