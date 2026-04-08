import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { config } from '@/config/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpLoggingInterceptor } from '@/shared/http/http-logging.interceptor';

function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  const allowedOrigins = new Set([
    config.mail.frontendUrl,
    ...config.cors.extraOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      if (config.cors.allowLocalhost && isLocalhostOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // whitelist: true,
      // forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hermes API')
    .setDescription('API REST do Hermes (NestJS + MongoDB).')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Admin API Key',
        description:
          'Chave de serviço para rotas admin (variável de ambiente `ADMIN_API_KEY`). Envie como `Authorization: Bearer <chave>`.',
      },
      'admin-api-key',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access token do utilizador no tenant (`sub` = userId, `org` = organizationId). Não usar a API key de staff nestas rotas.',
      },
      'tenant-jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
