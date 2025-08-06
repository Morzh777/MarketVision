import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { fileLogger } from './utils/logger';

// Загружаем переменные окружения
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    disableErrorMessages: false, // Включаем сообщения об ошибках для отладки
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`[ProductFilterService] 🚀 Product Filter Service запущен на порту ${port}`);
  console.log(`[ProductFilterService] 📝 Логи сохраняются в: /usr/src/app/logs/product-filter-${new Date().toISOString().split('T')[0]}.log`);
}

bootstrap(); 