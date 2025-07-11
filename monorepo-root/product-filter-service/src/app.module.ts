import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { PhotoService } from './services/photo.service';
import { OzonApiClient } from './grpc-clients/ozon-api.client';
import { WbApiClient } from './grpc-clients/wb-api.client';
import { ProductAggregatorService } from './services/product-aggregator.service';
import { ProductValidationService } from './services/product-validation.service';
import { ProductGroupingService } from './services/product-grouping.service';
import { ProductNormalizerService } from './services/product-normalizer.service';
import { DbApiClient } from './grpc-clients/db-api.client';
import { EnhancedPriceAnomalyService } from './services/enhanced-price-anomaly.service';
import { ValidationConfigService } from './config/validation.config';
import { OpenAiValidationService } from './services/openai.service';
import { ValidationProductModule } from './validation.product/validation.product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ValidationProductModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductAggregatorService,
    ProductValidationService,
    ProductGroupingService,
    ProductNormalizerService,
    PhotoService,
    OzonApiClient,
    WbApiClient,
    DbApiClient,
    EnhancedPriceAnomalyService,
    ValidationConfigService,
    OpenAiValidationService,
  ],
})
export class AppModule {} 