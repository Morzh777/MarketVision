import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  // Aggregate config for product-filter-service
  @Get('config')
  async getCategoryConfig(@Query('categoryKey') categoryKey: string) {
    const categories = (await this.service.listCategories()) as Array<{
      key: string;
    }>;
    const found = categories.find((c) => c.key === categoryKey);
    const category = (found ?? null) as { key: string } | null;
    const queries = (await this.service.listQueryConfigs(categoryKey)) as any[];
    const minPriceRules = (await this.service.listMinPriceRules(
      categoryKey,
    )) as any[];
    return { category, queries, minPriceRules };
  }

  // REST API для product-filter-service
  @Get(':categoryKey/config')
  async getCategoryConfigForFilter(@Param('categoryKey') categoryKey: string) {
    console.log('[REST] getCategoryConfigForFilter called with:', categoryKey);
    const category = await this.service.getCategoryByKey(categoryKey);
    console.log('[REST] Category from DB:', category);
    const result = {
      category: category
        ? {
            key: category.key,
            display: category.display,
            ozon_id: category.ozon_id || '',
            wb_id: category.wb_id || '',
          }
        : null,
    };
    console.log('[REST] Returning:', result);
    return result;
  }

  @Get(':categoryKey/queries')
  async getQueriesForCategoryFilter(@Param('categoryKey') categoryKey: string) {
    console.log('[REST] getQueriesForCategoryFilter called with:', categoryKey);
    const queries = await this.service.getQueriesForCategory(categoryKey);
    console.log('[REST] Queries from service:', queries);
    const result = {
      queries: queries.map((q: any) => ({
        query: q.query,
        platform_id: q.platform_id || '',
        exactmodels: q.exactmodels || '',
        platform: q.platform,
      })),
    };
    console.log('[REST] Returning queries:', result);
    return result;
  }

  // Groups
  @Get('groups')
  listGroups() {
    return this.service.listGroups();
  }

  @Post('groups')
  upsertGroup(@Body() body: { display: string }) {
    return this.service.upsertGroup(body.display);
  }

  // Categories
  @Get()
  listCategories() {
    return this.service.listCategories();
  }

  @Post()
  upsertCategory(
    @Body()
    body: {
      key: string;
      display: string;
      ozon_id?: string | null;
      wb_id?: string | null;
      groupDisplay?: string | null;
    },
  ) {
    console.log('POST /categories controller called with:', body);
    return this.service.upsertCategory(body);
  }

  @Post('remove')
  async removeCategory(@Body() body: { key: string }): Promise<unknown> {
    console.log('=== POST /categories/remove ===');
    console.log('CategoriesController.removeCategory called with:', body);
    return this.service.removeCategoryByKey(body.key);
  }

  // Query configs
  @Get('queries')
  listQueryConfigs(@Query('categoryKey') categoryKey?: string) {
    return this.service.listQueryConfigs(categoryKey);
  }

  @Post('queries')
  upsertQueryConfig(
    @Body()
    body: {
      categoryKey: string;
      query: string;
      platform_id?: string | null;
      exactmodels?: string | null;
      platform?: 'ozon' | 'wb' | 'both';
      recommended_price?: number | null;
    },
  ) {
    return this.service.upsertQueryConfig(body);
  }

  @Post('queries/remove')
  async removeQueryConfig(
    @Body() body: { categoryKey: string; query: string },
  ): Promise<unknown> {
    console.log('=== POST /categories/queries/remove ===');
    console.log('CategoriesController.removeQueryConfig called with:', body);
    return this.service.removeQueryConfig(body.categoryKey, body.query);
  }

  @Post('queries/recommended-price')
  async updateRecommendedPrice(
    @Body() body: { 
      categoryKey: string; 
      query: string; 
      recommended_price: number | null;
    },
  ): Promise<unknown> {
    console.log('=== POST /categories/queries/recommended-price ===');
    console.log('CategoriesController.updateRecommendedPrice called with:', body);
    return this.service.updateRecommendedPrice(body.categoryKey, body.query, body.recommended_price);
  }

  @Delete('queries/:query')
  async removeQueryConfigByPath(
    @Param('query') query: string,
    @Query('categoryKey') categoryKey: string,
  ): Promise<unknown> {
    console.log('=== DELETE /categories/queries/:query ===');
    console.log('CategoriesController.removeQueryConfigByPath called with:', { query, categoryKey });
    return this.service.removeQueryConfig(categoryKey, query);
  }

  // Min price rules
  @Get('min-price')
  listMinPriceRules(@Query('categoryKey') categoryKey?: string) {
    return this.service.listMinPriceRules(categoryKey);
  }

  @Post('min-price')
  upsertMinPriceRule(
    @Body()
    body: {
      categoryKey: string;
      model_key?: string | null;
      query?: string | null;
      min_price: number;
      confidence?: 'high' | 'medium' | 'low';
      source?: 'manual' | 'auto';
    },
  ) {
    return this.service.upsertMinPriceRule(body);
  }

  // Seed from test queries (dev only)
  @Post('admin/seed-test-queries')
  seedTestQueries() {
    return this.service.seedTestQueries();
  }
}
