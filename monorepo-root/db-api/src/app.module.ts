import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ProductController } from './controllers/product.controller';
import { GrpcController } from './controllers/grpc.controller';
import { HealthController } from './controllers/health.controller';
import { PrismaModule } from './prisma.module';
import { ProductModule } from './product.module';
import { JwtService } from './services/jwt.service';
import { ProductService } from './services/product.service';
import { PrismaService } from './services/prisma.service';
import { CategoriesModule } from './categories.module';
import { CategoriesController } from './controllers/categories.controller';
import { QueriesController } from './controllers/queries.controller';
import { QueriesModule } from './queries.module';
import { AuthModule } from './auth.module';
import { JWT_SECRET } from './config/settings';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        issuer: 'marketvision-api',
        audience: 'marketvision-client',
      },
    }),
    PrismaModule,
    ProductModule,
    CategoriesModule,
    QueriesModule,
    AuthModule,
  ],
  controllers: [
    ProductController,
    GrpcController,
    HealthController,
    CategoriesController,
    QueriesController,
  ],
  providers: [JwtService, ProductService, PrismaService, JwtStrategy],
})
export class AppModule {}
