import { Test, TestingModule } from '@nestjs/testing';
import { WbParserService } from './wb-parser.service';
import { RawProduct } from '../types/raw-product.interface';

describe('WbParserService', () => {
  let service: WbParserService;
  let mockWbApiClient: jest.Mocked<any>;

  beforeEach(async () => {
    mockWbApiClient = {
      searchProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WbParserService,
        {
          provide: 'WB_API_CLIENT',
          useValue: mockWbApiClient,
        },
      ],
    }).compile();

    service = module.get<WbParserService>(WbParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseProducts', () => {
    it('should return empty array when no products found', async () => {
      mockWbApiClient.searchProducts.mockResolvedValue([]);

      const result = await service.parseProducts('test', '1234');

      expect(result).toEqual([]);
      expect(mockWbApiClient.searchProducts).toHaveBeenCalledWith('test', 1234);
    });

    it('should return mapped products when API returns data', async () => {
      const mockApiResponse = [
        {
          id: 123456,
          name: 'Test Product',
          sizes: [{ price: { product: 100000 } }], // 1000 рублей в копейках
          pics: 'test-image-id',
        },
      ];

      mockWbApiClient.searchProducts.mockResolvedValue(mockApiResponse);

      const result = await service.parseProducts('test query', '1234');

      const expected: RawProduct[] = [
        {
          id: '123456',
          name: 'Test Product',
          price: 1000,
          image_url: 'https://images.wbstatic.net/c516x688/test-image-id.jpg',
          product_url: 'https://www.wildberries.ru/catalog/123456/detail.aspx',
          category: '1234',
          source: 'wb',
          query: 'test query',
        },
      ];

      expect(result).toEqual(expected);
    });

    it('should return empty array when category is invalid', async () => {
      const result = await service.parseProducts('test', 'invalid');

      expect(result).toEqual([]);
      expect(mockWbApiClient.searchProducts).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockWbApiClient.searchProducts.mockRejectedValue(new Error('API Error'));

      const result = await service.parseProducts('test', '1234');

      expect(result).toEqual([]);
    });

    it('should calculate minimum price from multiple sizes', async () => {
      const mockApiResponse = [
        {
          id: 123456,
          name: 'Test Product',
          sizes: [
            { price: { product: 150000 } }, // 1500 рублей
            { price: { product: 100000 } }, // 1000 рублей (минимум)
            { price: { product: 200000 } }, // 2000 рублей
          ],
          pics: 'test-image-id',
        },
      ];

      mockWbApiClient.searchProducts.mockResolvedValue(mockApiResponse);

      const result = await service.parseProducts('test', '1234');

      expect(result[0].price).toBe(1000);
    });

    it('should handle products without images', async () => {
      const mockApiResponse = [
        {
          id: 123456,
          name: 'Test Product',
          sizes: [{ price: { product: 100000 } }],
          pics: undefined,
        },
      ];

      mockWbApiClient.searchProducts.mockResolvedValue(mockApiResponse);

      const result = await service.parseProducts('test', '1234');

      expect(result[0].image_url).toBe('');
    });
  });
}); 