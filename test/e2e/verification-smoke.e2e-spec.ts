import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../utils/create-testing-app';
import { Server } from 'http';

const ADMIN_EXTL = process.env.DEFAULT_ADMIN_EXTL_ID as string;

describe('Verification admin SMOKE e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /admin/verification/requests should be reachable (200)', async () => {
    await request(app.getHttpServer() as Server)
      .get('/admin/verification/requests')
      .set('x-extl-id', ADMIN_EXTL)
      .expect(200);
  });
});
