import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ProductController } from './product.controller';
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
  controllers: [AuthController, ProductController],
  providers: [UserService, ProductService],
})
export class AppModule {}
