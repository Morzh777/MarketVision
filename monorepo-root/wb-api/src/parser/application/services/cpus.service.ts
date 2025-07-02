import { Injectable, Inject } from '@nestjs/common';
import { BaseParserService } from './base-parser.service';
import { WildberriesApiClient, PhotoService } from '../../domain/interfaces/wb-api.interface';
import { ProductFilterClient } from '../../../grpc-clients/product-filter.client';
import { WB_API_CLIENT, PHOTO_SERVICE } from '../../infrastructure/infrastructure.module';

@Injectable()
export class CpusService extends BaseParserService {
  // 🎯 Только название категории - xsubject приходит от Product-Filter-Service
  protected readonly category = 'processors';
  
  // 🧪 ТЕСТОВЫЕ ДАННЫЕ: МИКС валидных и невалидных процессоров
  protected readonly TEST_QUERIES = [
    // ✅ ВАЛИДНЫЕ (новые модели)
    'AMD Ryzen 7 7800X3D',
    'AMD Ryzen 9 9800X3D',
    'AMD Ryzen 9 9950X3D',
    'Intel Core i9-14900K',
    'Intel Core i7-14700K',
    
    // ❌ НЕВАЛИДНЫЕ (старые модели + неправильные названия - должны быть отклонены валидацией)
    'AMD Ryzen 5 5600X',        // Старая модель
    'Intel Core i5-10400F',     // Старая модель
    'кабель HDMI',              // Не процессор
    'блок питания 850W',        // Не процессор
  ];

  constructor(
    @Inject(ProductFilterClient) 
    filterClient: ProductFilterClient,
    @Inject(WB_API_CLIENT)
    wbApiClient: WildberriesApiClient,
    @Inject(PHOTO_SERVICE)
    photoService: PhotoService
  ) {
    super(filterClient, wbApiClient, photoService);
  }

  // Публичный метод для контроллера - ТОЛЬКО СЫРЫЕ ДАННЫЕ
  async findAllProcessors(testMode = false) {
    return this.findAllRawProducts(testMode);
  }
} 