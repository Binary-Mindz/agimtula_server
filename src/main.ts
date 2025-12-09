import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerSetting } from './config/swagger/swagger';
import { HttpExceptionFilter } from './core/error/CustomExceptionFilter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  SwaggerSetting(app);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
