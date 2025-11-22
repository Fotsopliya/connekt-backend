import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../utils/create-testing-app';
import { Server } from 'http';

describe('Users e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should accept Clerk webhook and then return current user via /users/me', async () => {
    const extlId = 'user_e2e_1';

    const webhookEvent = {
      type: 'user.created',
      data: {
        id: extlId,
        email_addresses: [{ email_address: 'e2e@example.com' }],
        image_url: null,
        public_metadata: { role: 'user' },
      },
    };

    await request(app.getHttpServer() as Server)
      .post('/auth/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(webhookEvent))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('ok', true);
      });

    await request(app.getHttpServer() as Server)
      .get('/users/me')
      .set('x-extl-id', extlId)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('extlId', extlId);
        expect(body).toHaveProperty('email', 'e2e@example.com');
      });
  });
});
