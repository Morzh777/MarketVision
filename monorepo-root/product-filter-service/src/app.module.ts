import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from './controllers/products.controller';
import { HealthController } from './controllers/health.controller';
import { ProductsService } from './services/products.service';
import { PhotoService } from './services/photo.service';
import { OzonApiClient } from './grpc-clients/ozon-api.client';
import { WbApiClient } from './grpc-clients/wb-api.client';
import { ProductAggregatorService } from './services/product-aggregator.service';
import { ProductGroupingService } from './services/product-grouping.service';
import { ProductNormalizerService } from './services/product-normalizer.service';
import { DbApiClient } from './grpc-clients/db-api.client';
import { ValidationServiceModule } from './services/validation.service/validation.service.module';
import { WB_API_ADDRESS, OZON_API_ADDRESS, DB_API_ADDRESS } from './config/settings';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ValidationServiceModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductAggregatorService,
    ProductGroupingService,
    ProductNormalizerService,
    PhotoService,
    {
      provide: WbApiClient,
      useValue: new WbApiClient(WB_API_ADDRESS),
    },
    {
      provide: OzonApiClient,
      useValue: new OzonApiClient(OZON_API_ADDRESS),
    },
    {
      provide: DbApiClient,
      useValue: new DbApiClient(DB_API_ADDRESS),
    },
  ],
})
export class AppModule {}
