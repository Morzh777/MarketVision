import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Создаем одно приложение для HTTP и gRPC
  const app = await NestFactory.create(AppModule);
  const httpPort = process.env.PORT || 3006;
  await app.listen(httpPort);

  console.log('🚀 WB API сервер запущен');
  console.log('📡 gRPC сервер: localhost:3000');
  console.log(`🌐 HTTP сервер: localhost:${httpPort} (для health checks)`);
  console.log('🔗 Готов принимать запросы от Product-Filter-Service');
  console.log('📡 Готов к парсингу (БЕЗ ФИЛЬТРАЦИИ И КЭШИРОВАНИЯ)');

  // Держим приложение живым
  process.stdin.resume();
}

bootstrap();
