import { Controller, Get, Query, Logger, Inject } from '@nestjs/common';
import { VideocardsService } from '../../application/services/videocards.service';
import { CpusService } from '../../application/services/cpus.service';
import { MotherboardsService } from '../../application/services/motherboards.service';

@Controller('parser')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly videocardsService: VideocardsService,
    private readonly cpusService: CpusService,
    private readonly motherboardsService: MotherboardsService
  ) {}

  // 🎯 НОВЫЙ ЭНДПОИНТ: для отдельных запросов от Product-Filter-Service
  @Get('search')
  async searchProducts(
    @Query('query') query: string,
    @Query('xsubject') xsubject: string,
    @Query('test') test?: string
  ) {
    const isTestMode = test === 'true';
    this.logger.log(`🔍 Поиск: \"${query}\" в категории ${xsubject}${isTestMode ? ' [ТЕСТ]' : ''}`);
    
    if (!query || !xsubject) {
      return { error: 'Требуются параметры query и xsubject' };
    }

    try {
      const xsubjectNum = parseInt(xsubject);
      
      // 🧪 ТЕСТОВЫЙ РЕЖИМ: Используем РЕАЛЬНЫЕ данные WB для валидации
      // В test mode валидацию проверяем на реальных данных WB
      
      // 🎯 Определяем какой сервис использовать по xsubject
      let service;
      switch (xsubjectNum) {
        case 3274: // Видеокарты
          service = this.videocardsService;
          break;
        case 3698: // Процессоры
          service = this.cpusService;
          break;
        case 3690: // Материнские платы
          service = this.motherboardsService;
          break;
        default:
          return { error: `Неизвестная категория: ${xsubject}` };
      }

      // 🚀 Используем новый метод для обработки запроса
      const products = await service.searchProductsByQuery(query, xsubjectNum);
      return products;
      
    } catch (error) {
      this.logger.error(`❌ Ошибка поиска "${query}":`, error);
      return { error: 'Внутренняя ошибка сервера' };
    }
  }

  // 🧪 ТЕСТОВЫЕ ДАННЫЕ: Заготовленные данные для проверки валидации
  private getTestData(query: string, xsubject: number): any[] {
    const baseId = Math.floor(Math.random() * 1000000);
    
    switch (xsubject) {
      case 3274: // Видеокарты
        return this.getVideocardsTestData(query, baseId);
      case 3698: // Процессоры
        return this.getProcessorsTestData(query, baseId);
      case 3690: // Материнские платы
        return this.getMotherboardsTestData(query, baseId);
      default:
        return [];
    }
  }

  // 🎮 ТЕСТОВЫЕ ДАННЫЕ: Видеокарты (микс валидных и невалидных)
  private getVideocardsTestData(query: string, baseId: number): any[] {
    const testData = [
      // ✅ ВАЛИДНЫЕ: Современные видеокарты
      {
        id: baseId + 1,
        name: 'NVIDIA GeForce RTX 5070 Ti Gaming 16GB',
        price: 81519,
        image_url: 'https://example.com/rtx5070ti.jpg',
        product_url: 'https://example.com/product/1'
      },
      {
        id: baseId + 2,
        name: 'RTX 5080 WINDFORCE OC 16GB',
        price: 114776,
        image_url: 'https://example.com/rtx5080.jpg',
        product_url: 'https://example.com/product/2'
      },
      {
        id: baseId + 3,
        name: 'AMD Radeon RX 7900 XT Gaming 20GB',
        price: 75000,
        image_url: 'https://example.com/rx7900xt.jpg',
        product_url: 'https://example.com/product/3'
      },
      
      // ❌ НЕВАЛИДНЫЕ: Должны быть отклонены валидацией
      {
        id: baseId + 10,
        name: 'RTX 4060 Ti Gaming OC 8GB',
        price: 45000,
        image_url: 'https://example.com/rtx4060ti.jpg',
        product_url: 'https://example.com/product/10'
      },
      {
        id: baseId + 11,
        name: 'Удлинительный кабель для видеокарты PCIE',
        price: 1563,
        image_url: 'https://example.com/cable.jpg',
        product_url: 'https://example.com/product/11'
      },
      {
        id: baseId + 12,
        name: 'GTX 1660 Super Gaming 6GB',
        price: 25000,
        image_url: 'https://example.com/gtx1660.jpg',
        product_url: 'https://example.com/product/12'
      }
    ];

    // 🧪 ТЕСТОВЫЙ РЕЖИМ: Возвращаем ВСЕ данные для проверки валидации
    // Не фильтруем - пусть валидаторы сами решают что валидно!
    return testData;
  }

  // 🖥️ ТЕСТОВЫЕ ДАННЫЕ: Процессоры (микс валидных и невалидных)
  private getProcessorsTestData(query: string, baseId: number): any[] {
    const testData = [
      // ✅ ВАЛИДНЫЕ: Современные процессоры 13-14 поколения Intel и Ryzen 5000+
      {
        id: baseId + 20,
        name: 'Intel Core i5-14600KF BOX LGA1700',
        price: 15918,
        image_url: 'https://example.com/i5-14600kf.jpg',
        product_url: 'https://example.com/product/20'
      },
      {
        id: baseId + 21,
        name: 'Intel Core i9-14900KF OEM',
        price: 37141,
        image_url: 'https://example.com/i9-14900kf.jpg',
        product_url: 'https://example.com/product/21'
      },
      {
        id: baseId + 22,
        name: 'AMD Ryzen 7 7800X3D AM5 BOX',
        price: 31149,
        image_url: 'https://example.com/7800x3d.jpg',
        product_url: 'https://example.com/product/22'
      },
      {
        id: baseId + 23,
        name: 'AMD Ryzen 5 5600X AM4 BOX',
        price: 7415,
        image_url: 'https://example.com/5600x.jpg',
        product_url: 'https://example.com/product/23'
      },
      
      // ❌ НЕВАЛИДНЫЕ: Старые поколения - должны быть отклонены
      {
        id: baseId + 30,
        name: 'Intel Core i5-8400 LGA1151 BOX',
        price: 12000,
        image_url: 'https://example.com/i5-8400.jpg',
        product_url: 'https://example.com/product/30'
      },
      {
        id: baseId + 31,
        name: 'AMD Ryzen 5 2600X AM4 BOX',
        price: 3802,
        image_url: 'https://example.com/r5-2600x.jpg',
        product_url: 'https://example.com/product/31'
      },
      {
        id: baseId + 32,
        name: 'AMD Athlon X4-970 AM4 BOX',
        price: 2500,
        image_url: 'https://example.com/athlon.jpg',
        product_url: 'https://example.com/product/32'
      },
      {
        id: baseId + 33,
        name: 'Intel Core i7 4770K LGA1150',
        price: 3573,
        image_url: 'https://example.com/i7-4770k.jpg',
        product_url: 'https://example.com/product/33'
      }
    ];

    // 🧪 ТЕСТОВЫЙ РЕЖИМ: Возвращаем ВСЕ данные для проверки валидации
    // НЕ фильтруем - пусть Product-Filter-Service сам валидирует!
    return testData;
  }

  // 🔧 ТЕСТОВЫЕ ДАННЫЕ: Материнские платы (микс валидных и невалидных)
  private getMotherboardsTestData(query: string, baseId: number): any[] {
    const testData = [
      // ✅ ВАЛИДНЫЕ: Современные чипсеты
      {
        id: baseId + 40,
        name: 'ASUS PRIME B650-PLUS AM5 DDR5',
        price: 12500,
        image_url: `https://images.wbstatic.net/c516x688/${baseId + 40}.jpg`,
        product_url: `https://www.wildberries.ru/catalog/${baseId + 40}/detail.aspx`
      },
      {
        id: baseId + 41,
        name: 'MSI MAG Z790 TOMAHAWK WIFI LGA1700',
        price: 25000,
        image_url: `https://images.wbstatic.net/c516x688/${baseId + 41}.jpg`,
        product_url: `https://www.wildberries.ru/catalog/${baseId + 41}/detail.aspx`
      },
      {
        id: baseId + 42,
        name: 'GIGABYTE X670E AORUS MASTER AM5',
        price: 35000,
        image_url: `https://images.wbstatic.net/c516x688/${baseId + 42}.jpg`,
        product_url: `https://www.wildberries.ru/catalog/${baseId + 42}/detail.aspx`
      },
      
      // ❌ НЕВАЛИДНЫЕ: Старые чипсеты - должны быть отклонены
      {
        id: baseId + 50,
        name: 'ASUS H110M-K LGA1151 DDR4',
        price: 3500,
        image_url: `https://images.wbstatic.net/c516x688/${baseId + 50}.jpg`,
        product_url: `https://www.wildberries.ru/catalog/${baseId + 50}/detail.aspx`
      },
      {
        id: baseId + 51,
        name: 'MSI B450M GAMING PLUS AM4',
        price: 4500,
        image_url: `https://images.wbstatic.net/c516x688/${baseId + 51}.jpg`,
        product_url: `https://www.wildberries.ru/catalog/${baseId + 51}/detail.aspx`
      }
    ];

    // 🧪 ТЕСТОВЫЙ РЕЖИМ: Возвращаем ВСЕ данные для проверки валидации
    // НЕ фильтруем - пусть Product-Filter-Service сам валидирует!
    return testData;
  }
} 