import { Injectable } from '@nestjs/common';
import {
  ClerkWebhookService,
  ClerkEvent,
  ClerkUser,
} from '../../src/modules/auth/clerk.service';

@Injectable()
export class MockClerkWebhookService extends ClerkWebhookService {
  // Override only the verification to bypass Svix signature during tests
  override verifyAndParse(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    headers: Record<string, string | string[] | undefined>,
    rawBody: string,
  ): ClerkEvent {
    const parsed = JSON.parse(rawBody) as unknown;
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      const e = parsed as { type: string; data?: unknown };
      let data: ClerkUser | undefined;
      if (e.data && typeof e.data === 'object') {
        const rec = e.data as Record<string, unknown>;
        const id = rec['id'];
        if (typeof id === 'string') {
          const emailAddressesRaw = rec['email_addresses'];
          const email_addresses = Array.isArray(emailAddressesRaw)
            ? (emailAddressesRaw as { email_address: string }[])
            : undefined;
          const email_address =
            typeof rec['email_address'] === 'string'
              ? (rec['email_address'] as string)
              : undefined;
          const image_url =
            typeof rec['image_url'] === 'string'
              ? (rec['image_url'] as string)
              : undefined;
          const public_metadata =
            typeof rec['public_metadata'] === 'object' && rec['public_metadata'] !== null
              ? (rec['public_metadata'] as { role?: string })
              : undefined;
          data = { id, email_addresses, email_address, image_url, public_metadata };
        }
      }
      return { type: e.type, data } as ClerkEvent;
    }
    throw new Error('Invalid JSON');
  }
}
