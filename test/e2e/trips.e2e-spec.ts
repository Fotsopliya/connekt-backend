import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../utils/create-testing-app';
import { Server } from 'http';

describe('Trips e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /trips returns 200 and an array (may be empty)', async () => {
    await request(app.getHttpServer() as Server)
      .get('/trips')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });
});
