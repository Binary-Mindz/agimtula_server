import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerSetting } from './config/swagger/swagger';
import { HttpExceptionFilter } from './core/error/CustomExceptionFilter';
import { PrismaExceptionFilter } from './core/error/prisma-exception.filter';
import { PrismaValidationExceptionFilter } from './core/error/prisma-validation.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  SwaggerSetting(app);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new PrismaValidationExceptionFilter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
