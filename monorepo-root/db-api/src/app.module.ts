import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ProductController } from './product.controller';
import { GrpcController } from './grpc.controller';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma.module';
import { UserService } from './services/userService';
import { ProductService } from './product.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [
    AuthController,
    ProductController,
    GrpcController,
    HealthController,
  ],
  providers: [UserService, ProductService],
})
export class AppModule {}
