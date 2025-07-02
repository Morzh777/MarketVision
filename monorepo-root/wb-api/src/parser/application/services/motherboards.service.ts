import { Injectable, Inject } from '@nestjs/common';
import { BaseParserService } from './base-parser.service';
import { WildberriesApiClient, PhotoService } from '../../domain/interfaces/wb-api.interface';
import { ProductFilterClient } from '../../../grpc-clients/product-filter.client';
import { WB_API_CLIENT, PHOTO_SERVICE } from '../../infrastructure/infrastructure.module';

@Injectable()
export class MotherboardsService extends BaseParserService {
  // 🎯 Только название категории - xsubject приходит от Product-Filter-Service
  protected readonly category = 'motherboards';
  
  // 🧪 ТЕСТОВЫЕ ДАННЫЕ: МИКС валидных и невалидных материнских плат
  protected readonly TEST_QUERIES = [
    // ✅ ВАЛИДНЫЕ (новые модели)
    'ASUS ROG STRIX B760-F',
    'MSI MPG B850 GAMING EDGE',
    'GIGABYTE Z790 AORUS ELITE',
    'ASRock X870E Taichi',
    
    // ❌ НЕВАЛИДНЫЕ (старые модели + неправильные названия - должны быть отклонены валидацией)
    'ASUS B550-F',              // Старая модель
    'MSI B450 TOMAHAWK',        // Старая модель
    'кабель HDMI',              // Не материнская плата
    'блок питания 850W',        // Не материнская плата
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
  async findAllMotherboards(testMode = false) {
    return this.findAllRawProducts(testMode);
  }
} 