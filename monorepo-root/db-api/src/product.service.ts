import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Сервис для работы с продуктами и историей цен через Prisma
 */

// Явный тип Product, соответствующий вашей модели
export type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  category: string;
  source: string;
  query: string;
  created_at: Date;
};

// Тип для истории цен
export type PriceHistoryProduct = {
  id: string;
  query: string;
  source: string;
  price: number;
};

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт продукт
   */
  async create(data: Omit<Product, 'created_at'>): Promise<Product> {
    return this.prisma.product.create({ data }) as unknown as Product;
  }

  /**
   * Возвращает все продукты
   */
  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany() as unknown as Product[];
  }

  /**
   * Находит продукт по id
   */
  async findOne(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } }) as unknown as Product | null;
  }

  /**
   * Обновляет продукт
   */
  async update(id: string, data: Partial<Omit<Product, 'created_at'>>): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data }) as unknown as Product;
  }

  /**
   * Удаляет продукт
   */
  async remove(id: string): Promise<Product> {
    return this.prisma.product.delete({ where: { id } }) as unknown as Product;
  }

  /**
   * Массовое создание продуктов (skipDuplicates)
   */
  async batchCreate(products: any[]): Promise<number> {
    if (!products.length) return 0;
    // Группируем по query, оставляем только с минимальной ценой
    const byQuery: Record<string, any[]> = {};
    for (const p of products) {
      if (!byQuery[p.query]) byQuery[p.query] = [];
      byQuery[p.query].push(p);
    }
    const minProducts = Object.values(byQuery).map(group =>
      group.reduce((min, p) => (p.price < min.price ? p : min), group[0])
    );
    const prismaProducts = minProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url,
      product_url: p.product_url,
      category: p.category,
      source: p.source,
      query: p.query,
    }));
    await this.prisma.product.createMany({ data: prismaProducts, skipDuplicates: true });
    return products.length;
  }

  /**
   * Массовое создание истории цен
   */
  async batchCreatePriceHistory(products: PriceHistoryProduct[]): Promise<number> {
    if (!products.length) return 0;
    // Получаем список id реально существующих продуктов
    const existingIds = (await this.prisma.product.findMany({
      where: { id: { in: products.map(p => p.id) } },
      select: { id: true },
    })).map(p => p.id);

    await this.prisma.priceHistory.createMany({
      data: products.map((p: PriceHistoryProduct) => ({
        product_id: existingIds.includes(p.id) ? p.id : undefined,
        query: p.query,
        source: p.source,
        price: p.price,
      })),
      skipDuplicates: false,
    });
    return products.length;
  }
} 