import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

function resolveCorsOrigins(): string | string[] | boolean {
  // مؤقت: السماح لأي أصل (يعكس Origin الطلب — متوافق مع credentials)
  if (
    process.env.CORS_ALLOW_ALL === 'true' ||
    process.env.CORS_ORIGINS?.trim() === '*'
  ) {
    return true;
  }
  const fromList = process.env.CORS_ORIGINS?.split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (fromList?.length) {
    return fromList;
  }
  return process.env.ADMIN_WEB_URL ?? 'http://localhost:4010';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsRoot = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsRoot)) {
    mkdirSync(uploadsRoot, { recursive: true });
  }
  app.useStaticAssets(uploadsRoot, { prefix: '/api/uploads' });

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ISP Admin API')
    .setDescription('نظام إدارة مكتب خدمات إنترنت — المرحلة أ')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.API_PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://${host}:${port}`);
  // eslint-disable-next-line no-console
  console.log(`OpenAPI: http://${host}:${port}/api/docs`);
}

bootstrap();
