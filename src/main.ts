import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerSetting } from './config/swagger/swagger';
import { HttpExceptionFilter } from './core/error/CustomExceptionFilter';
import { PrismaExceptionFilter } from './core/error/prisma-exception.filter';
import { PrismaValidationExceptionFilter } from './core/error/prisma-validation.filter';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory

  // Static folders
  const publicDir = join(process.cwd(), "public");
  const uploadDir = join(process.cwd(), "uploads");

  app.use("/", express.static(publicDir));
  app.use("/uploads", express.static(uploadDir));

  // Raw body parser for Stripe webhook BEFORE JSON parser
  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

  // Then global JSON parser for everything else
  app.use(bodyParser.json());

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger
  SwaggerSetting(app);

  // Global filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new PrismaValidationExceptionFilter(),
  );

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3003);
}
void bootstrap();
