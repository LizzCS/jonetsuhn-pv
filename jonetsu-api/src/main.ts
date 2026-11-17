import 'dotenv/config';

import { HttpAdapterHost, NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { PrismaErrorFilter } from './common/prisma-error.filter.js';
import { validacionDto } from './common/validacion.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Orígenes del frontend separados por coma (FRONTEND_URL en .env)
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? ['http://localhost:3000'],
  });

  app.useGlobalPipes(validacionDto);
  app.useGlobalFilters(new PrismaErrorFilter(app.get(HttpAdapterHost).httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
