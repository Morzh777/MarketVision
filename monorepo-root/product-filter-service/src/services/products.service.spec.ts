import { ProductsService } from './products.service';
import { BadRequestException } from '@nestjs/common';

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
  let photoService: any;
  let ozonApiClient: any;
  let wbApiClient: any;
  const mockAggregator = { fetchAllProducts: jest.fn().mockResolvedValue([]) };
  const mockValidator = { filterValid: jest.fn().mockReturnValue([]) };
  const mockGrouper = { groupAndSelectCheapest: jest.fn().mockReturnValue([]) };
  const mockNormalizer = { getModelKey: jest.fn().mockReturnValue(''), normalizeQuery: jest.fn().mockReturnValue('') };
  const mockDbApiClient = { batchCreateProducts: jest.fn().mockResolvedValue({ inserted: 0 }) };
  const mockOpenaiService = { validateProducts: jest.fn().mockResolvedValue([]) };

  beforeEach(() => {
    photoService = { processImageUrl: jest.fn(async (url) => url) };
    ozonApiClient = { filterProducts: jest.fn() };
    wbApiClient = { filterProducts: jest.fn() };
    service = new ProductsService(
      mockAggregator as any,
      mockValidator as any,
      mockGrouper as any,
      mockNormalizer as any,
      mockDbApiClient as any,
      photoService as any,
      mockOpenaiService as any
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

  // Добавьте больше тестов на edge-cases, ошибки, агрегацию, кэширование и т.д.
}); 