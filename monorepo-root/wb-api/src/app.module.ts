import { Module } from '@nestjs/common';
import { GrpcServerService } from './grpc-server/grpc-server.service';
import { WbParserService } from './parser/wb-parser.service';

@Module({
  providers: [GrpcServerService, WbParserService],
})
export class AppModule {} 