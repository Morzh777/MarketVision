import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class GrpcController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod('RawProductService', 'BatchCreateProducts')
  async batchCreateProducts(data: { products: any[]; market_stats?: any }) {
    const { products, market_stats } = data;

    // Конвертируем RawProduct в ProductForService
    const productsForService = products.map((product) => ({
      ...product,
      image_url: product.image_url || product.imageUrl || '',
      product_url: product.product_url || product.productUrl || '',
    }));

    const inserted = await this.productService.batchCreate(productsForService);

    if (market_stats) {
      await this.productService.saveMarketStats(market_stats);
    }

    return {
      inserted,
      history: inserted, // Каждый продукт создает запись в истории
    };
  }
} 