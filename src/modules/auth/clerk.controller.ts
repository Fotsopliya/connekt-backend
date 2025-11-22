import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ClerkWebhookService } from './clerk.service';
import { Request } from 'express';

@Controller('auth/webhooks')
export class ClerkWebhookController {
  constructor(private readonly clerkService: ClerkWebhookService) {}

  @Post('clerk')
  @HttpCode(200)
  async handle(
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: string },
  ) {
    // raw body is provided by express.raw middleware registered in main.ts
    // but depending on content-type/body parser it can be Buffer|string|object
    let rawBody: string;
    const body: unknown = req.body as unknown;
    if (Buffer.isBuffer(body)) {
      rawBody = body.toString('utf8');
    } else if (typeof body === 'string') {
      rawBody = body;
    } else if (body && typeof body === 'object') {
      rawBody = JSON.stringify(body);
    } else {
      rawBody = '';
    }
    return this.clerkService.handleEvent(headers, rawBody);
  }
}
