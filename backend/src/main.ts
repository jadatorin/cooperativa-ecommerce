import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Response compression (behind env flag)
  if (process.env.ENABLE_COMPRESSION === 'true') {
    const compression = await import('compression');
    app.use(compression.default());
    logger.log('Response compression enabled');
  }

  // Rate limiting is configured via ThrottlerModule.forRoot() in AppModule.
  // The ThrottlerGuard is registered as APP_GUARD in AppModule providers.
  if (process.env.ENABLE_RATE_LIMIT === 'true') {
    logger.log('Rate limiting enabled (100 req/min)');
  }

  // CORS
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Cooperativa E-commerce API')
    .setDescription('API para e-commerce de cooperativa')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
