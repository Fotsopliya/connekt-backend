import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../utils/create-testing-app';
import { makeSvixHeaders } from '../utils/svix-helpers';

const ADMIN_EXTL = process.env.DEFAULT_ADMIN_EXTL_ID as string;
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET as string;

describe('Verification admin e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('user submits KYC then admin approves', async () => {
    const extlId = 'user_verif_1';
    const webhookEvent = {
      type: 'user.created',
      data: {
        id: extlId,
        email_addresses: [{ email_address: 'verif@example.com' }],
        image_url: null,
        public_metadata: { role: 'user' },
      },
    };
    const payload = JSON.stringify(webhookEvent);
    const headers = makeSvixHeaders(WEBHOOK_SECRET, payload);

    await request(app.getHttpServer() as any)
      .post('/auth/webhooks/clerk')
      .set(headers)
      .send(payload)
      .expect(200);

    await request(app.getHttpServer() as any)
      .post('/users/kyc')
      .set('x-extl-id', extlId)
      .send({ notes: 'please verify me' })
      .expect(201);

    const listResp = await request(app.getHttpServer() as any)
      .get('/admin/verification/requests')
      .set('x-extl-id', ADMIN_EXTL)
      .expect(200);

    const reqId = listResp.body[0]?.id as string;
    await request(app.getHttpServer() as any)
      .patch(`/admin/verification/${reqId}/approve`)
      .set('x-extl-id', ADMIN_EXTL)
      .send({ notes: 'ok' })
      .expect(200);
  });
});
