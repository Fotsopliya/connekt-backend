import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppDataSource } from '../../../data-source';

import { Request } from 'express';

// Simple idempotency interceptor: requires Idempotency-Key header on POST
// Stores keys in idempotency_keys table and rejects duplicates within 24h.
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.method !== 'POST') {
      return next.handle();
    }
    const key = (req.headers['idempotency-key'] as string) || '';
    if (!key) {
      throw new BadRequestException('Missing Idempotency-Key header');
    }

    const ds = AppDataSource;
    const path = req.originalUrl || req.url;
    const extlId = (req.headers['x-extl-id'] as string) || null;

    return from(
      ds.query(
        `INSERT INTO idempotency_keys(idempotency_key, method, path, extl_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (idempotency_key)
         DO UPDATE SET used_at = NOW()
         RETURNING idempotency_key`,
        [key, req.method, path, extlId],
      ),
    ).pipe(switchMap(() => next.handle()));
  }
}
