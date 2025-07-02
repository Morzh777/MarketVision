import { Module } from '@nestjs/common';
import { ParserModule } from './parser/parser.module';
import { GrpcServerService } from './grpc-server/grpc-server.service';

@Module({
  imports: [ParserModule],
  providers: [GrpcServerService],
})
export class AppModule {}
