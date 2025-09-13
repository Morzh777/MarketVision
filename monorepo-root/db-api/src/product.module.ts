import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './services/prisma.service';

@Module({
  imports: [PrismaModule],
  providers: [ProductService, PrismaService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
