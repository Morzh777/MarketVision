import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from './controllers/products.controller';
import { PriceStatisticsController } from './controllers/price-statistics.controller';
import { ProductsService } from './services/products.service';
import { PriceStatisticsService } from './services/price-statistics.service';
import { RedisService } from './services/redis.service';
import { PhotoService } from './services/photo.service';
import { OzonApiClient } from './grpc-clients/ozon-api.client';
import { WbApiClient } from './grpc-clients/wb-api.client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [ProductsController, PriceStatisticsController],
  providers: [
    ProductsService, 
    PriceStatisticsService,
    RedisService, 
    PhotoService,
    OzonApiClient,
    WbApiClient
  ],
})
export class AppModule {} 