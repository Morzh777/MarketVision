import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../services/products.service';
import { ProductRequestDto } from '../dto/product-request.dto';

const mockProductsService = {
  getProducts: jest.fn().mockResolvedValue({ products: [], total_queries: 0, total_products: 0, processing_time_ms: 0, cache_hits: 0, cache_misses: 0 }),
  getQueryStatistics: jest.fn().mockResolvedValue({ total_queries: 0, total_products: 0, queries_stats: [] }),
  clearCacheForCategory: jest.fn().mockResolvedValue(1),
};

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();
    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return products for valid request', async () => {
    const dto: ProductRequestDto = { queries: ['test'], category: 'videocards' };
    const result = await controller.searchProducts(dto);
    expect(result).toHaveProperty('products');
  });

  it('should throw error for missing queries', async () => {
    // @ts-ignore
    await expect(controller.searchProducts({ category: 'videocards' })).rejects.toThrow();
  });

  it('should throw error for missing category', async () => {
    // @ts-ignore
    await expect(controller.searchProducts({ queries: ['test'] })).rejects.toThrow();
  });

  it('should throw error for invalid category', async () => {
    const dto: ProductRequestDto = { queries: ['test'], category: 'invalid' };
    await expect(controller.searchProducts(dto)).rejects.toThrow();
  });

  it('should return statistics for valid request', async () => {
    const dto: ProductRequestDto = { queries: ['test'], category: 'videocards' };
    const result = await controller.getQueryStatistics(dto);
    expect(result).toHaveProperty('total_queries');
  });
}); 