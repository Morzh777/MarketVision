import { GrpcServerService } from './grpc-server/grpc-server.service';
import { ParserModule } from './parser/parser.module';
import { CpusService } from './parser/application/services/cpus.service';
import { VideocardsService } from './parser/application/services/videocards.service';
import { MotherboardsService } from './parser/application/services/motherboards.service';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  // Создаем DI-контейнер
  const app = await NestFactory.createApplicationContext(ParserModule);

  // Получаем сервисы для передачи в GrpcServerService
  const cpusService = app.get(CpusService);
  const videocardsService = app.get(VideocardsService);
  const motherboardsService = app.get(MotherboardsService);

  // Запускаем gRPC сервер
  const grpcServer = new GrpcServerService(cpusService, videocardsService, motherboardsService);
  grpcServer['onModuleInit']();

  console.log('🚀 WB API запущен (только gRPC на порту 3001)');
  console.log('📡 HTTP сервер отключен - используется только gRPC');

  // Держим процесс живым
  process.stdin.resume();
}

bootstrap();
