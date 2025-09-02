import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  providers: [PrismaService, CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}


