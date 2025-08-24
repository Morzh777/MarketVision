import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';
import type { ProductForService, MarketStats } from './types/product.types';

@Controller()
export class GrpcController {
  constructor(private readonly productService: ProductService) {}

  private toStr(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    if (value === null || value === undefined) return '';
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  private toNum(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  @GrpcMethod('RawProductService', 'BatchCreateProducts')
  async batchCreateProducts(data: {
    products: unknown[];
    market_stats?: unknown;
    marketStats?: unknown;
  }) {
    type IncomingProduct = {
      id?: unknown;
      name?: unknown;
      price?: unknown;
      image_url?: unknown;
      imageUrl?: unknown;
      product_url?: unknown;
      productUrl?: unknown;
      category?: unknown;
      source?: unknown;
      query?: unknown;
    };

    type IncomingStats = {
      productId?: unknown;
      product_id?: unknown;
      query?: unknown;
      category?: unknown;
      source?: unknown;
      min?: unknown;
      max?: unknown;
      mean?: unknown;
      median?: unknown;
      iqr?: unknown; // Json в Prisma
      totalCount?: unknown;
      total_count?: unknown;
      createdAt?: unknown;
      created_at?: unknown;
    };

    const rawProducts: IncomingProduct[] = Array.isArray(data.products)
      ? (data.products as IncomingProduct[])
      : [];

    const productsForService: ProductForService[] = rawProducts.map((p) => {
      const image_url = this.toStr(p.image_url ?? p.imageUrl ?? '');
      const product_url = this.toStr(p.product_url ?? p.productUrl ?? '');
      return {
        id: this.toStr(p.id),
        name: this.toStr(p.name),
        price: this.toNum(p.price),
        image_url,
        product_url,
        category: this.toStr(p.category),
        source: this.toStr(p.source),
        query: this.toStr(p.query),
      };
    });

    const inserted = await this.productService.batchCreate(productsForService);

    const s = ((data.market_stats ?? data.marketStats) || undefined) as
      | IncomingStats
      | undefined;

    if (s) {
      const iqrNumber = Array.isArray((s as Record<string, unknown>).iqr)
        ? 0
        : this.toNum((s as Record<string, unknown>).iqr);

      const mapped: MarketStats = {
        productId: this.toStr(s.productId ?? s.product_id),
        query: this.toStr(s.query),
        category: this.toStr(s.category),
        source: this.toStr(s.source),
        min: this.toNum(s.min),
        max: this.toNum(s.max),
        mean: this.toNum(s.mean),
        median: this.toNum(s.median),
        iqr: iqrNumber,
        totalCount: this.toNum(s.totalCount ?? s.total_count),
        createdAt:
          (s.createdAt as string | Date | undefined) ||
          (s.created_at as string | Date | undefined),
      };

      await this.productService.saveMarketStats(mapped);
    }

    return { inserted, history: inserted };
  }
}
