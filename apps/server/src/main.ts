import {
  ValidationPipe,
} from '@nestjs/common';

import {
  NestFactory,
} from '@nestjs/core';

import { AppModule } from './app.module';
import { corsOriginCallback } from './common/config/cors';

async function bootstrap() {
const app =
    await NestFactory.create(
      AppModule,
      { rawBody: true },
    );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: corsOriginCallback,
    credentials: true,
  });

  await app.listen(
    process.env.PORT || 3005,
  );
}

bootstrap();