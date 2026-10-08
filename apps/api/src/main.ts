import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
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
  // نعطّل parser الافتراضي حتى يسبق express.text مسار USER_END
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const uploadsRoot = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsRoot)) {
    mkdirSync(uploadsRoot, { recursive: true });
  }
  // Mist يطلب *.m3u8.dtsh (GET+Range / PUT) — لا تخدمه كملف فارغ عبر send
  app.use(
    '/api/uploads/live-hls-masters',
    (req: Request, res: Response, next: NextFunction) => {
      const pathOnly = (req.path || '').split('?')[0] ?? '';
      if (!pathOnly.endsWith('.dtsh')) {
        next();
        return;
      }
      if (
        req.method === 'PUT' ||
        req.method === 'POST' ||
        req.method === 'DELETE'
      ) {
        res.status(204).end();
        return;
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        // محتوى صغير ثابت حتى لا يفشل Range على ملف حجمه 0
        const body = Buffer.from('DTSH\n', 'utf8');
        res.status(200);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', String(body.length));
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        res.end(body);
        return;
      }
      next();
    },
  );
  app.useStaticAssets(uploadsRoot, { prefix: '/api/uploads' });

  app.setGlobalPrefix('api');
  // Mist USER_END يرسل نصاً بأسطر — قبل json للمسار فقط
  // @see https://docs.mistserver.org/mistserver/integration/triggers/list/USER_END
  app.use(
    '/api/public/live/viewing-reports/user-end',
    express.text({ type: '*/*', limit: '256kb' }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
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
  // ملف يقرأه سكربت USER_END (Mist → localhost)
  try {
    const varLive = join(process.cwd(), 'var', 'live');
    mkdirSync(varLive, { recursive: true });
    writeFileSync(join(varLive, 'api.port'), `${port}\n`, { encoding: 'utf8' });
  } catch {
    /* غير حرج */
  }
  // eslint-disable-next-line no-console
  console.log(`API listening on http://${host}:${port}`);
  // eslint-disable-next-line no-console
  console.log(`OpenAPI: http://${host}:${port}/api/docs`);
}

bootstrap();
