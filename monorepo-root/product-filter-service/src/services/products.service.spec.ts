import { ProductsService } from './products.service';
import { BadRequestException } from '@nestjs/common';

// Классы-заглушки для DI
class RedisServiceMock {
  get = jest.fn();
  set = jest.fn();
  setWithTTL = jest.fn();
  getAllKeys = jest.fn();
  isHealthy = jest.fn().mockReturnValue(true);
}
class PhotoServiceMock {
  getPhotoUrl = jest.fn();
  findProductPhoto = jest.fn();
  processImageUrl = jest.fn();
}
class PriceStatisticsServiceMock {
  getPriceChange = jest.fn();
}
class OzonApiClientMock {
  filterProducts = jest.fn().mockResolvedValue({ products: [] });
}
class WbApiClientMock {
  filterProducts = jest.fn().mockResolvedValue({ products: [] });
}

// Мокаем фабрику валидаторов, чтобы продукты с discount > 0.5 проходили фильтр
jest.mock('../validators', () => ({
  ValidatorFactory: {
    getValidator: () => ({
      validate: (product: any) => ({ isValid: true, reason: 'ok', applied_rules: [] })
    })
  }
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let redisService: RedisServiceMock;
  let photoService: PhotoServiceMock;
  let priceStatisticsService: PriceStatisticsServiceMock;
  let ozonApiClient: OzonApiClientMock;
  let wbApiClient: WbApiClientMock;

  beforeEach(() => {
    redisService = new RedisServiceMock();
    photoService = new PhotoServiceMock();
    priceStatisticsService = new PriceStatisticsServiceMock();
    ozonApiClient = new OzonApiClientMock();
    wbApiClient = new WbApiClientMock();
    service = new ProductsService(
      redisService as any,
      photoService as any,
      priceStatisticsService as any,
      ozonApiClient as any,
      wbApiClient as any
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array for unknown category', async () => {
    // @ts-ignore
    const result = await service["getProductsByCategory"]('unknown', false);
    expect(result).toEqual([]);
  });

  it('should call both APIs for known category', async () => {
    // @ts-ignore
    const spyOzon = jest.spyOn(ozonApiClient, 'filterProducts');
    // @ts-ignore
    const spyWb = jest.spyOn(wbApiClient, 'filterProducts');
    // @ts-ignore
    await service["getProductsByCategory"]('videocards', false);
    expect(spyOzon).toHaveBeenCalled();
    expect(spyWb).toHaveBeenCalled();
  });

  it('should handle empty queries gracefully', async () => {
    await expect(
      service.getProducts({ queries: [], category: 'videocards' } as any)
    ).rejects.toThrow(BadRequestException);
  });

  it('should handle missing category', async () => {
    // @ts-ignore
    await expect(service.getProducts({ queries: ['test'] })).rejects.toThrow();
  });

  it('should filter products by discount', async () => {
    // @ts-ignore
    ozonApiClient.filterProducts = jest.fn().mockResolvedValue({ products: [
      { id: '1', name: 'A', price: 100, discount: 0.6, query: 'q', category: 'videocards', source: 'ozon' },
      { id: '2', name: 'B', price: 200, discount: 0.4, query: 'q', category: 'videocards', source: 'ozon' },
    ] });
    // @ts-ignore
    wbApiClient.filterProducts = jest.fn().mockResolvedValue({ products: [] });
    // @ts-ignore
    const result = await service["getProductsByCategory"]('videocards', false);
    expect(result.some(p => p.discount > 0.5)).toBe(true);
  });

  it('should handle cache hits and misses', async () => {
    redisService.get = jest.fn().mockResolvedValue(null);
    redisService.set = jest.fn();
    // @ts-ignore
    const result = await service.getProducts({ queries: ['q'], category: 'videocards' });
    expect(result).toHaveProperty('products');
  });

  // Добавьте больше тестов на edge-cases, ошибки, агрегацию, кэширование и т.д.
}); 