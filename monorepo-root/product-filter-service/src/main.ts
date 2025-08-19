import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { fileLogger } from './utils/logger';
import { SERVICE_PORT } from './config/settings';

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

  await app.listen(SERVICE_PORT);
  
  console.log(`[ProductFilterService] 🚀 Product Filter Service запущен на порту ${SERVICE_PORT}`);
  console.log(`[ProductFilterService] 📝 Логи сохраняются в: /usr/src/app/logs/product-filter-${new Date().toISOString().split('T')[0]}.log`);
}

bootstrap(); 