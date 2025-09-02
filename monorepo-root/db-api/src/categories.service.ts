import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Groups
  listGroups() {
    return this.prisma.categoryGroup.findMany({
      include: { categories: true },
      orderBy: { id: 'asc' },
    });
  }

  upsertGroup(display: string) {
    return this.prisma.categoryGroup.upsert({
      where: { display },
      create: { display },
      update: {},
    });
  }

  // Categories
  listCategories() {
    return this.prisma.category.findMany({
      include: { group: true },
      orderBy: { id: 'asc' },
    });
  }

  async upsertCategory(data: {
    key: string;
    display: string;
    ozon_id?: string | null;
    wb_id?: string | null;
    groupDisplay?: string | null;
  }) {
    console.log('upsertCategory called with:', data);
    const group = data.groupDisplay
      ? await this.upsertGroup(data.groupDisplay)
      : null;

    const result = await this.prisma.category.upsert({
      where: { key: data.key },
      create: {
        key: data.key,
        display: data.display,
        ozon_id: data.ozon_id ?? null,
        wb_id: data.wb_id ?? null,
        groupId: group?.id ?? null,
      },
      update: {
        display: data.display,
        ozon_id: data.ozon_id ?? null,
        wb_id: data.wb_id ?? null,
        groupId: group?.id ?? null,
      },
    });
    console.log('upsertCategory result:', result);
    return result;
  }

  async removeCategoryByKey(key: string) {
    const existing = await this.prisma.category.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('Category not found');
    return this.prisma.category.delete({ where: { key } });
  }

  getCategoryByKey(key: string) {
    return this.prisma.category.findUnique({ where: { key } });
  }

  async getQueriesForCategory(categoryKey: string) {
    const category = await this.prisma.category.findUnique({
      where: { key: categoryKey },
    });
    if (!category) throw new NotFoundException('Category not found');
    
    const queryConfigs = await this.prisma.queryConfig.findMany({
      where: { categoryId: category.id },
    });

    // Обогащаем данные platform_id из категории
    return queryConfigs.map(config => ({
      ...config,
      platform_id: config.platform === 'ozon' ? category.ozon_id : 
                   config.platform === 'wb' ? category.wb_id : 
                   config.platform_id
    }));
  }

  // Query configs
  async listQueryConfigs(categoryKey?: string) {
    if (categoryKey) {
      const cat = await this.prisma.category.findUnique({
        where: { key: categoryKey },
      });
      if (!cat) throw new NotFoundException('Category not found');
      return this.prisma.queryConfig.findMany({
        where: { categoryId: cat.id },
      });
    }
    return this.prisma.queryConfig.findMany();
  }

  async upsertQueryConfig(data: {
    categoryKey: string;
    query: string;
    platform_id?: string | null;
    exactmodels?: string | null;
    platform?: 'ozon' | 'wb' | 'both';
  }) {
    const cat = await this.prisma.category.findUnique({ where: { key: data.categoryKey } });
    if (!cat) throw new NotFoundException('Category not found');
    const targetPlatforms: Array<'ozon' | 'wb'> =
      !data.platform || data.platform === 'both'
        ? ['ozon', 'wb']
        : [data.platform];

    const results = [] as any[];
    for (const p of targetPlatforms) {
      const where = { query_categoryId_platform: { query: data.query, categoryId: cat.id, platform: p } } as any;
      const res = await this.prisma.queryConfig.upsert({
        where,
        create: {
          query: data.query,
          platform_id: data.platform_id ?? null,
          exactmodels: data.exactmodels ?? null,
          platform: p as any,
          categoryId: cat.id,
        },
        update: {
          platform_id: data.platform_id ?? null,
          exactmodels: data.exactmodels ?? null,
        },
      });
      results.push(res);
    }
    return results.length === 1 ? results[0] : results;
  }

  async removeQueryConfig(categoryKey: string, query: string) {
    console.log('removeQueryConfig called with:', { categoryKey, query });

    // Проверим все категории в базе
    const allCategories = await this.prisma.category.findMany();
    console.log(
      'All categories in DB:',
      allCategories.map((c: any) => ({
        id: c.id,
        key: c.key,
        display: c.display,
      })),
    );

    const cat = await this.prisma.category.findUnique({
      where: { key: categoryKey },
    });
    console.log('Found category:', cat);
    if (!cat) throw new NotFoundException('Category not found');
    // Удаляем все записи с данным запросом для категории (для всех платформ)
    const result = await this.prisma.queryConfig.deleteMany({
      where: { query, categoryId: cat.id },
    });
    console.log('Delete result:', result);
    return result;
  }

  // MinPrice rules
  async listMinPriceRules(categoryKey?: string) {
    if (categoryKey) {
      const cat = await this.prisma.category.findUnique({ where: { key: categoryKey } });
      if (!cat) throw new NotFoundException('Category not found');
      return this.prisma.minPriceRule.findMany({ where: { categoryId: cat.id } });
    }
    return this.prisma.minPriceRule.findMany();
  }

  async upsertMinPriceRule(data: {
    categoryKey: string;
    model_key?: string | null;
    query?: string | null;
    min_price: number;
    confidence?: 'high' | 'medium' | 'low';
    source?: 'manual' | 'auto';
  }) {
    const cat = await this.prisma.category.findUnique({ where: { key: data.categoryKey } });
    if (!cat) throw new NotFoundException('Category not found');

    const existing = await this.prisma.minPriceRule.findFirst({
      where: {
        categoryId: cat.id,
        model_key: data.model_key ?? null,
        query: data.query ?? null,
      },
    });

    if (!existing) {
      return this.prisma.minPriceRule.create({
        data: {
          categoryId: cat.id,
          model_key: data.model_key ?? null,
          query: data.query ?? null,
          min_price: data.min_price,
          confidence: (data.confidence as any) ?? 'medium',
          source: (data.source as any) ?? 'manual',
        },
      });
    }

    return this.prisma.minPriceRule.update({
      where: { id: existing.id },
      data: {
        min_price: data.min_price,
        confidence: (data.confidence as any) ?? existing.confidence,
        source: (data.source as any) ?? existing.source,
      },
    });
  }

  // Seed test queries similar to product-filter-service test set
  async seedTestQueries() {
    const testQueries: Record<string, string[]> = {
      videocards: ['rtx 5070', 'rtx 5070 ti', 'rtx 5080', 'rtx 5090'],
      processors: ['7800x3d', '9800x3d', '9950x3d'],
      motherboards: ['Z790', 'B760', 'X870E', 'B850', 'B760M-K'],
      playstation: ['playstation 5', 'playstation 5 pro'],
      nintendo_switch: ['nintendo switch 2'],
      steam_deck: ['steam deck oled'],
      iphone: ['iphone 16 pro', 'iphone 16', 'iphone 15 pro', 'iphone 15', 'iphone 16 pro max', 'iphone 15 pro max'],
    };

    const results: Array<{ categoryKey: string; created: number; updated: number }> = [];
    for (const [categoryKey, queries] of Object.entries(testQueries)) {
      await this.upsertCategory({ key: categoryKey, display: categoryKey });
      let created = 0;
      const updated = 0;
      for (const q of queries) {
        const res = await this.upsertQueryConfig({
          categoryKey,
          query: q,
          platform: 'both',
        });
        if (Array.isArray(res)) {
          created += res.length; // approximate; upsert does not indicate
        } else {
          created += 1;
        }
      }
      results.push({ categoryKey, created, updated });
    }
    return { ok: true, results };
  }
}