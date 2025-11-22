import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as functions from 'firebase-functions';
const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  // Raw body required for Svix signature verification (Clerk webhooks)
  app.use('/auth/webhooks/clerk', express.raw({ type: '*/*' }));
  app.enableCors({ origin: '*', credentials: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Connekt API')
    .setDescription('REST API documentation for Connekt backend')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 5000);
}

bootstrap()
  .then(() => console.log('Nest ready'))
  .catch((err: Error) => {
    console.error('Nest broken', err);
    process.exit(1);
  });

export const api = functions.https.onRequest(server);
// void bootstrap();
