import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { fileLogger } from './utils/logger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Настраиваем CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Глобальная валидация DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Product Filter Service')
    .setDescription('API documentation for Product Filter Service')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  fileLogger.log(`🚀 Product Filter Service запущен на порту ${port}`);
  fileLogger.log(`📝 Логи сохраняются в: ${fileLogger.getLogFilePath()}`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    fileLogger.log('Получен сигнал SIGINT, завершение работы...');
    await app.close();
    fileLogger.log('Сервер остановлен');
    process.exit(0);
  });
}

bootstrap(); 