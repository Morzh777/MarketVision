import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { CategoriesService } from './services/categories.service';
import { CategoriesController } from './controllers/categories.controller';
import { QueriesService } from './services/queries.service';
import { JwtService } from './services/jwt.service';

@Module({
  providers: [PrismaService, CategoriesService, QueriesService, JwtService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
