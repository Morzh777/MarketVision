import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';
import { ProductController } from './product.controller';
import { GrpcController } from './grpc.controller';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma.module';
import { ProductModule } from './product.module';
import { UserService } from './services/userService';
import { ProductService } from './product.service';
import { CategoriesModule } from './categories.module';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ProductModule,
    CategoriesModule,
  ],
  controllers: [
    AuthController,
    AdminController,
    ProductController,
    GrpcController,
    HealthController,
    CategoriesController,
  ],
  providers: [UserService, ProductService],
})
export class AppModule {}
