import { Module } from '@nestjs/common';
import { QueriesController } from './controllers/queries.controller';
import { QueriesService } from './services/queries.service';
import { PrismaService } from './services/prisma.service';
import { JwtService } from './services/jwt.service';

@Module({
  controllers: [QueriesController],
  providers: [QueriesService, PrismaService, JwtService],
  exports: [QueriesService],
})
export class QueriesModule {}
