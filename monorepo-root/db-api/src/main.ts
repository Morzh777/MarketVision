import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CORS_ORIGINS, GRPC_BIND_URL, REST_PORT } from './config/settings';
import { Request, Response, NextFunction } from 'express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  // Создаем основное приложение для REST API
  const app = await NestFactory.create(AppModule);

  // Настраиваем cookie-parser для работы с cookies
  app.use(cookieParser());

  // Настраиваем CORS для REST API
  app.enableCors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Добавляем логирование всех запросов
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Query params:', req.query);
    console.log('Body:', req.body);
    next();
  });

  // Создаем gRPC микросервис
  const grpcUrl = GRPC_BIND_URL;
  const protoPath = join(process.cwd(), 'src/proto/raw-product.proto');

  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'raw_product',
      protoPath,
      url: grpcUrl,
    },
  });

  console.log('--- DB-API HYBRID SERVICE START ---');
  console.log('Proto path:', protoPath);
  console.log('gRPC URL:', grpcUrl);
  console.log('REST API will be available on port', REST_PORT);

  // Запускаем gRPC микросервис
  await microservice.listen();

  // Запускаем REST API на порту 3003
  await app.listen(REST_PORT);

  console.log('DB-API hybrid service started:');
  console.log('- REST API: http://localhost:' + REST_PORT);
  console.log('- gRPC: ' + grpcUrl);
}

void bootstrap();
