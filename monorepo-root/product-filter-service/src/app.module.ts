import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { PhotoService } from './services/photo.service';
import { OzonApiClient } from './grpc-clients/ozon-api.client';
import { WbApiClient } from './grpc-clients/wb-api.client';
import { ProductAggregatorService } from './services/product-aggregator.service';
import { ProductGroupingService } from './services/product-grouping.service';
import { ProductNormalizerService } from './services/product-normalizer.service';
import { DbApiClient } from './grpc-clients/db-api.client';
import { ValidationServiceModule } from './services/validation.service/validation.service.module';
import { MLModule } from './services/ml/ml.module';
import { MLController } from './controllers/ml.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ValidationServiceModule, // Подключаем новую систему валидации
    MLModule, // Подключаем ML модуль
  ],
  controllers: [ProductsController, MLController],
  providers: [
    ProductsService,
    ProductAggregatorService,
    ProductGroupingService,
    ProductNormalizerService,
    PhotoService,
    OzonApiClient,
    WbApiClient,
    DbApiClient,
  ],
})
export class AppModule {} 