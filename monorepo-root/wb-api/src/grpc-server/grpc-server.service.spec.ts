import { Test, TestingModule } from '@nestjs/testing';
import { GrpcServerService } from './grpc-server.service';
import { WbParserService } from '../parser/wb-parser.service';
import * as grpc from '@grpc/grpc-js';

describe('GrpcServerService', () => {
  let service: GrpcServerService;
  let mockWbParserService: jest.Mocked<WbParserService>;
  let mockCall: any;
  let mockCallback: jest.Mock;

  beforeEach(async () => {
    mockWbParserService = {
      parseProducts: jest.fn(),
    } as any;

    mockCall = {
      request: {
        query: 'test query',
        category: '1234',
        categoryKey: 'test-key',
      },
    };

    mockCallback = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrpcServerService,
        {
          provide: WbParserService,
          useValue: mockWbParserService,
        },
      ],
    }).compile();

    service = module.get<GrpcServerService>(GrpcServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRawProducts', () => {
    it('should return products successfully', async () => {
      const mockProducts = [
        {
          id: '123',
          name: 'Test Product',
          price: 1000,
          image_url: 'test-url',
          product_url: 'test-product-url',
          category: '1234',
          source: 'wb',
          query: 'test query',
        },
      ];

      mockWbParserService.parseProducts.mockResolvedValue(mockProducts);

      await (service as any).getRawProducts(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, {
        products: [
          {
            ...mockProducts[0],
            category: 'test-key', // categoryKey используется
          },
        ],
        total_count: 1,
        source: 'wb',
      });
    });

    it('should validate required fields and return error', async () => {
      const invalidCall = {
        request: {
          query: '',
          category: '1234',
        },
      };

      await (service as any).getRawProducts(invalidCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Query и category обязательны',
        details: 'Отсутствуют обязательные параметры запроса',
      });
    });

    it('should handle parsing errors', async () => {
      mockWbParserService.parseProducts.mockRejectedValue(
        new Error('Test error')
      );

      await (service as any).getRawProducts(mockCall, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        code: grpc.status.INTERNAL,
        message: 'Ошибка парсинга: Test error',
      });
    });

    it('should use category as fallback when categoryKey is not provided', async () => {
      const callWithoutCategoryKey = {
        request: {
          query: 'test query',
          category: '1234',
        },
      };

      const mockProducts = [
        {
          id: '123',
          name: 'Test Product',
          price: 1000,
          image_url: 'test-url',
          product_url: 'test-product-url',
          category: '1234',
          source: 'wb',
          query: 'test query',
        },
      ];

      mockWbParserService.parseProducts.mockResolvedValue(mockProducts);

      await (service as any).getRawProducts(callWithoutCategoryKey, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, {
        products: [
          {
            ...mockProducts[0],
            category: '1234', // category используется как fallback
          },
        ],
        total_count: 1,
        source: 'wb',
      });
    });
  });
}); 