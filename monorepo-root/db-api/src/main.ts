import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Создаем основное приложение для REST API
  const app = await NestFactory.create(AppModule);

  // Настраиваем CORS для REST API
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://feada47ca023bf54aad00884df9777f8.serveo.net',
      'https://*.serveo.net',
      'http://*.serveo.net',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Создаем gRPC микросервис
  const grpcUrl = process.env.GRPC_URL ?? '0.0.0.0:50051';
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
  console.log('REST API will be available on port 3004');

  // Запускаем gRPC микросервис
  await microservice.listen();

  // Запускаем REST API на порту 3003
  const port = process.env.PORT || 3004;
  await app.listen(port);

  console.log('DB-API hybrid service started:');
  console.log('- REST API: http://localhost:' + port);
  console.log('- gRPC: ' + grpcUrl);
}

bootstrap();
