import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getConfig, validateConfig } from './config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  validateConfig();

  const config = getConfig();
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Express query parser — 'extended' uses qs library which parses ids[]=1&ids[]=2 as { ids: [1, 2] }
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('query parser', 'extended');

  // CORS
  app.enableCors({
    origin: config.appOrigin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Graceful shutdown
  app.enableShutdownHooks();

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Library App API')
    .setDescription('Library management system REST API')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.port);
  logger.log(`Application running on port ${config.port}`);
  logger.log(`Swagger docs: http://localhost:${config.port}/api/docs`);
}

bootstrap();
