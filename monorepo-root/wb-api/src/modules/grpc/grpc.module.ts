import { Module } from '@nestjs/common';
import { GrpcServerService } from '../../grpc-server/grpc-server.service';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [ParserModule],
  providers: [GrpcServerService],
  exports: [GrpcServerService],
})
export class GrpcModule {} 