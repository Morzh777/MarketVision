import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { QueriesService } from './queries.service';

export interface QueryConfigResult {
  id: number;
  query: string;
  platform_id: string | null;
  exactmodels: string | null;
  platform: string;
  categoryId: number;
  recommended_price: number | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queriesService: QueriesService,
  ) {}

  // Получение всех категорий
  async getAllCategories() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        key: true,
        display: true,
        ozon_id: true,
        wb_id: true,
      },
      orderBy: {
        display: 'asc',
      },
    });
  }

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

  async updateCategory(
    key: string,
    data: {
      display: string;
      ozon_id?: string | null;
      wb_id?: string | null;
      groupDisplay?: string | null;
    },
  ) {
    console.log('updateCategory called with:', { key, data });

    // Проверяем, что категория существует
    const existing = await this.prisma.category.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // Обрабатываем группу если указана
    const group = data.groupDisplay
      ? await this.upsertGroup(data.groupDisplay)
      : null;

    // Обновляем категорию
    const result = await this.prisma.category.update({
      where: { key },
      data: {
        display: data.display,
        ozon_id: data.ozon_id ?? null,
        wb_id: data.wb_id ?? null,
        groupId: group?.id ?? null,
      },
    });

    console.log('updateCategory result:', result);
    return result;
  }

  async updateCategoryById(
    id: number,
    data: {
      key: string;
      display: string;
      ozon_id?: string | null;
      wb_id?: string | null;
      groupDisplay?: string | null;
    },
  ) {
    console.log('updateCategoryById called with:', { id, data });

    // Проверяем, что категория существует
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // Обрабатываем группу если указана
    const group = data.groupDisplay
      ? await this.upsertGroup(data.groupDisplay)
      : null;

    // Обновляем категорию
    const result = await this.prisma.category.update({
      where: { id },
      data: {
        key: data.key, // Обновляем ключ
        display: data.display,
        ozon_id: data.ozon_id ?? null,
        wb_id: data.wb_id ?? null,
        groupId: group?.id ?? null,
      },
    });

    console.log('updateCategoryById result:', result);
    return result;
  }

  async removeCategoryByKey(key: string) {
    const existing = await this.prisma.category.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('Category not found');
    return this.prisma.category.delete({ where: { key } });
  }

  async removeCategoryById(id: number) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    return this.prisma.category.delete({ where: { id } });
  }

  getCategoryByKey(key: string) {
    return this.prisma.category.findUnique({ where: { key } });
  }

  getCategoryById(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  // MinPrice rules
  async listMinPriceRules(categoryKey?: string) {
    if (categoryKey) {
      const cat = await this.prisma.category.findUnique({
        where: { key: categoryKey },
      });
      if (!cat) throw new NotFoundException('Category not found');
      return this.prisma.minPriceRule.findMany({
        where: { categoryId: cat.id },
      });
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
    const cat = await this.prisma.category.findUnique({
      where: { key: data.categoryKey },
    });
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
          confidence: data.confidence ?? 'medium',
          source: data.source ?? 'manual',
        },
      });
    }

    return this.prisma.minPriceRule.update({
      where: { id: existing.id },
      data: {
        min_price: data.min_price,
        confidence: data.confidence ?? existing.confidence,
        source: data.source ?? existing.source,
      },
    });
  }
}
