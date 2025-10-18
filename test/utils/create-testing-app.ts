import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as express from 'express';
import { AppModule } from '../../src/app.module';

export async function createTestingApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  // match production raw body requirement for Clerk webhook
  app.use('/auth/webhooks/clerk', express.raw({ type: '*/*' }));
  await app.init();
  return app;
}
