import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerSetting } from './config/swagger/swagger';
import { HttpExceptionFilter } from './core/error/CustomExceptionFilter';
import { PrismaExceptionFilter } from './core/error/prisma-exception.filter';
import { PrismaValidationExceptionFilter } from './core/error/prisma-validation.filter';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

    // Global filters - Order matters!
    app.useGlobalFilters(
      new PrismaExceptionFilter(),
      new PrismaValidationExceptionFilter(),
      new HttpExceptionFilter(),
    );

    // Global validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
      }),
    );

    const port = process.env.PORT ?? 3003;
    await app.listen(port);
    logger.log(`Application running on port ${port}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}
void bootstrap();
