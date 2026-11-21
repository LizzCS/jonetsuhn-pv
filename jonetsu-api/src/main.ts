import 'dotenv/config';

import { HttpAdapterHost, NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { PrismaErrorFilter } from './common/prisma-error.filter.js';
import { validacionDto } from './common/validacion.pipe.js';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Orígenes del frontend separados por coma (FRONTEND_URL en .env)
  app.enableCors({
    origin: 'http://localhost:3001', // URL de tu frontend
    credentials: true,
  });

  app.useGlobalPipes(validacionDto);
  app.useGlobalFilters(
    new PrismaErrorFilter(app.get(HttpAdapterHost).httpAdapter),
  );

  // Documentación Swagger en /api (solo fuera de producción).
  // Para probar endpoints protegidos: ejecutar POST /auth/login desde la
  // misma página; el navegador guarda la cookie access_token y la envía sola.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Jonetsu API')
      .setDescription('Endpoints del backend de Jonetsu')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();

    SwaggerModule.setup('api', app, () =>
      SwaggerModule.createDocument(app, config),
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
