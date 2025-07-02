import { Injectable, Inject } from '@nestjs/common';
import { BaseParserService } from './base-parser.service';
import { WildberriesApiClient, PhotoService } from '../../domain/interfaces/wb-api.interface';
import { ProductFilterClient } from '../../../grpc-clients/product-filter.client';
import { WB_API_CLIENT, PHOTO_SERVICE } from '../../infrastructure/infrastructure.module';

@Injectable()
export class VideocardsService extends BaseParserService {
  // 🎯 Только название категории - xsubject приходит от Product-Filter-Service
  protected readonly category = 'videocards';
  
  // 🧪 ТЕСТОВЫЕ ДАННЫЕ: МИКС валидных и невалидных видеокарт
  protected readonly TEST_QUERIES = [
    // ✅ ВАЛИДНЫЕ (новые модели)
    'NVIDIA GeForce RTX 5070 Ti',
    'NVIDIA GeForce RTX 5080',
    'AMD Radeon RX 7900 XT',
    'NVIDIA GeForce RTX 4090',
    
    // ❌ НЕВАЛИДНЫЕ (старые модели + неправильные названия - должны быть отклонены валидацией)
    'NVIDIA GeForce RTX 4060 Ti',   // Старая модель
    'NVIDIA GeForce GTX 1660',      // Очень старая GTX
    'кабель HDMI',                  // Не видеокарта
    'блок питания 850W',            // Не видеокарта
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
  async findAllVideocards(testMode = false) {
    return this.findAllRawProducts(testMode);
  }
} 