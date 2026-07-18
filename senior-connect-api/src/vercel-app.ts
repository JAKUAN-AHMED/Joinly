import 'dotenv/config'; // must load before AppModule reads process.env
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Express } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

let cachedServer: Express | null = null;

/**
 * Serverless entry used by api/index.js on Vercel. Bootstraps the Nest app
 * once per function instance; warm invocations reuse the cached Express handler.
 * Mirrors the pipeline in main.ts exactly — keep the two in sync.
 */
export async function getServer(): Promise<Express> {
  if (!cachedServer) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn'],
    });
    app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance() as Express;
  }
  return cachedServer;
}
