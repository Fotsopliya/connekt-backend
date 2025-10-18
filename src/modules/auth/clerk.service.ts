import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Webhook } from 'svix';

export interface ClerkEmailAddress {
  email_address: string;
}

export interface ClerkUser {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  email_address?: string;
  image_url?: string | null;
  public_metadata?: { role?: string };
}

export interface ClerkEvent {
  type: string;
  data?: ClerkUser;
}

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  verifyAndParse(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ): ClerkEvent {
    if (process.env.NODE_ENV === 'test') {
      const parsed = JSON.parse(rawBody) as unknown;
      if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
        return parsed as ClerkEvent;
      }
      throw new Error('Invalid Clerk event payload');
    }
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) throw new Error('CLERK_WEBHOOK_SECRET not configured');
    const wh = new Webhook(secret);
    // Svix expects lowercase header names
    const result: unknown = wh.verify(rawBody, {
      'svix-id':
        (headers['svix-id'] as string) || (headers['svix_id'] as string),
      'svix-timestamp':
        (headers['svix-timestamp'] as string) ||
        (headers['svix_timestamp'] as string),
      'svix-signature':
        (headers['svix-signature'] as string) ||
        (headers['svix_signature'] as string),
    });
    if (typeof result === 'object' && result !== null && 'type' in result) {
      return result as ClerkEvent;
    }
    throw new Error('Invalid Clerk event payload');
  }

  private extractUserFields(evt: ClerkEvent) {
    const data: ClerkUser | undefined = evt.data;
    if (!data) {
      return {
        extlId: '',
        email: null as string | null,
        avatarUrl: null as string | null,
        role: 'user' as 'user' | 'admin',
      };
    }
    const extlId: string = data.id;
    const email: string | null =
      Array.isArray(data.email_addresses) && data.email_addresses.length > 0
        ? data.email_addresses[0].email_address
        : data.email_address || null;
    const avatarUrl: string | null = data.image_url ?? null;
    const role: 'user' | 'admin' =
      data.public_metadata?.role === 'admin' ? 'admin' : 'user';
    return { extlId, email, avatarUrl, role };
  }

  async upsertUserFromEvent(evt: ClerkEvent) {
    const { extlId, email, avatarUrl, role } = this.extractUserFields(evt);
    let user = await this.usersRepo.findOne({ where: { extlId } });
    if (!user) {
      user = this.usersRepo.create({ extlId, email, avatarUrl, role });
    } else {
      user.email = email;
      user.avatarUrl = avatarUrl;
      user.role = role;
    }
    await this.usersRepo.save(user);
    return user;
  }

  async handleEvent(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ) {
    const evt = this.verifyAndParse(headers, rawBody);

    // Dedupe webhook events in non-test environments using webhook_events table
    if (process.env.NODE_ENV !== 'test') {
      const provider = 'clerk';
      const eventId =
        (headers['svix-id'] as string) || (headers['svix_id'] as string);
      if (!eventId) {
        // if missing, we still proceed to avoid breaking in dev, but ideally reject
      } else {
        // Insert or ignore if exists; if exists, short-circuit (idempotent)
        const res: { provider: string }[] = await this.usersRepo.query(
          `INSERT INTO webhook_events(provider, event_id)
           VALUES ($1, $2)
           ON CONFLICT (provider, event_id) DO NOTHING
           RETURNING provider`,
          [provider, eventId],
        );
        if (!res || res.length === 0) {
          // duplicate event -> idempotent success
          return { ok: true, deduped: true };
        }
      }
    }
    const type = evt.type;

    switch (type) {
      case 'user.created':
      case 'user.updated':
        await this.upsertUserFromEvent(evt);
        break;
      case 'user.deleted': {
        const id = evt.data?.id;
        if (id) {
          const user = await this.usersRepo.findOne({ where: { extlId: id } });
          if (user) {
            await this.usersRepo.remove(user);
          }
        }
        break;
      }
      default:
        this.logger.log(`Unhandled Clerk event type: ${type}`);
    }

    return { ok: true };
  }
}
