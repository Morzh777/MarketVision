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
  async batchCreateProducts({ products }: { products: any[] }): Promise<{ inserted: number, history: number }> {
    console.log('products before validation:', products);
    // DTO-валидация
    const validProducts = products.filter((p) => {
      const dto = Object.assign(new RawProductDto(), {
        ...p,
        image_url: p.image_url ?? p.imageUrl,
        product_url: p.product_url ?? p.productUrl,
      });
      const errors = validateSync(dto);
      return errors.length === 0;
    });
    console.log('validProducts after validation:', validProducts);
    // После валидации приводим к snake_case для сервиса
    const snakeProducts = validProducts.map((p) => ({
      ...p,
      image_url: p.image_url ?? p.imageUrl,
      product_url: p.product_url ?? p.productUrl,
    }));
    const inserted = await this.productService.batchCreate(snakeProducts);
    const history = await this.productService.batchCreatePriceHistory(snakeProducts);
    return { inserted, history };
  }

  // Аналогично реализуются другие методы (FindOne, Create, Update, Remove)
} 