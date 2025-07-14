import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';
import type { Product } from './product.service';
import { RawProductDto } from './dto/raw-product.dto';
import { validateSync } from 'class-validator';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod('ProductService', 'FindAll')
  async findAll(): Promise<{ products: Product[] }> {
    const products = await this.productService.findAll();
    return { products };
  }

  @GrpcMethod('raw_product.RawProductService', 'BatchCreateProducts')
  async batchCreateProducts(obj: any): Promise<{ inserted: number, history: number }> {
    // Логируем весь входящий объект для отладки
    console.log('[DB-API] batchCreateProducts RAW:', obj);
    const { products, marketStats } = obj;
    // Логируем входящие данные для отладки
    console.log('[DB-API] batchCreateProducts', { productsCount: products.length, marketStats });
    // DTO-валидация
    const validProducts = products.filter((p: any) => {
      const dto = Object.assign(new RawProductDto(), {
        ...p,
        image_url: p.image_url ?? p.imageUrl,
        product_url: p.product_url ?? p.productUrl,
      });
      const errors = validateSync(dto);
      return errors.length === 0;
    });
    // После валидации приводим к snake_case для сервиса
    const snakeProducts = validProducts.map((p: any) => ({
      ...p,
      image_url: p.image_url ?? p.imageUrl,
      product_url: p.product_url ?? p.productUrl,
    }));
    // Сохраняем продукты, историю и статистику (если есть)
    const inserted = await this.productService.batchCreate(snakeProducts);
    const history = await this.productService.batchCreatePriceHistory(snakeProducts);
    if (marketStats) {
      await this.productService.saveMarketStats(marketStats);
    }
    return { inserted, history };
  }

  // Аналогично реализуются другие методы (FindOne, Create, Update, Remove)
} 