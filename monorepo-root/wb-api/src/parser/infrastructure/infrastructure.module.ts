import { Module } from '@nestjs/common';
import { WildberriesApiClientImpl } from './api/wb-api.client';
import { PhotoServiceImpl } from './services/photo.service';

// Токены для DI
export const WB_API_CLIENT = 'WB_API_CLIENT';
export const PHOTO_SERVICE = 'PHOTO_SERVICE';

@Module({
  providers: [
    {
      provide: WB_API_CLIENT,
      useClass: WildberriesApiClientImpl,
    },
    {
      provide: PHOTO_SERVICE,
      useClass: PhotoServiceImpl,
    },
    // Кэширование отключено - только в Product-Filter-Service
    WildberriesApiClientImpl,
    PhotoServiceImpl,
  ],
  exports: [
    WB_API_CLIENT,
    PHOTO_SERVICE,
    WildberriesApiClientImpl,
    PhotoServiceImpl,
  ],
})
export class InfrastructureModule {} 