import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('🚀 WB API gRPC сервер на порту 3000...');
  console.log('✅ WB API gRPC сервер успешно запущен');
  console.log('🔗 Готов принимать запросы от Product-Filter-Service');
  console.log('📡 gRPC сервер: localhost:3000');
  console.log('📡 Готов к парсингу (БЕЗ ФИЛЬТРАЦИИ И КЭШИРОВАНИЯ)');
  
  // Держим приложение живым
  await app.init();
  process.stdin.resume();
}

bootstrap();
