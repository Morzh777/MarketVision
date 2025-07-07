import { Module } from '@nestjs/common';
import { GrpcModule } from './modules/grpc/grpc.module';
import { ParserModule } from './modules/parser/parser.module';

@Module({
  imports: [GrpcModule, ParserModule],
})
export class AppModule {} 