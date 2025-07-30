import { Module } from '@nestjs/common';
import { GrpcModule } from './modules/grpc/grpc.module';
import { ParserModule } from './modules/parser/parser.module';
import { HealthController } from './health.controller';

@Module({
  imports: [GrpcModule, ParserModule],
  controllers: [HealthController],
})
export class AppModule {}
