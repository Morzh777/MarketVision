import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { QueriesService, QueryConfigResult } from '../services/queries.service';
import { JwtService } from '../services/jwt.service';
import { Request } from 'express';

@Controller('queries')
export class QueriesController {
  constructor(
    private readonly queriesService: QueriesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Получает запросы для категории (для product-filter-service)
   */
  @Get('category/:categoryKey')
  async getQueriesForCategoryFilter(@Param('categoryKey') categoryKey: string) {
    console.log('[REST] getQueriesForCategoryFilter called with:', categoryKey);
    const queries = await this.queriesService.getQueriesForCategory(categoryKey);
    console.log('[REST] Queries from service:', queries);
    
    interface QueryItem {
      id: number;
      query: string;
      platform_id?: string | null;
      exactmodels?: string | null;
      platform: string;
      recommended_price?: number | null;
    }

    const result = {
      queries: queries.map((q: QueryItem) => ({
        id: q.id,
        query: q.query,
        platform_id: q.platform_id || '',
        exactmodels: q.exactmodels || '',
        platform: q.platform,
        recommended_price: q.recommended_price || null,
      })),
    };
    console.log('[REST] Returning queries:', result);
    return result;
  }

  /**
   * Получает список конфигураций запросов
   */
  @Get()
  listQueryConfigs(@Query('categoryKey') categoryKey?: string) {
    return this.queriesService.listQueryConfigs(categoryKey);
  }

  /**
   * Создает или обновляет конфигурацию запроса
   */
  @Post()
  upsertQueryConfig(
    @Req() request: Request,
    @Body()
    body: {
      id?: number;
      categoryKey: string;
      query: string;
      platform_id?: string | null;
      exactmodels?: string | null;
      platform?: 'ozon' | 'wb' | 'both';
      recommended_price?: number | null;
    },
  ): Promise<QueryConfigResult | QueryConfigResult[]> {
    console.log('POST /queries controller called with:', body);

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    console.log('🔍 Проверяем токен:', token ? 'present' : 'missing');

    // Валидируем JWT токен
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    console.log('✅ JWT токен валиден, пользователь:', decoded.username);

    return this.queriesService.upsertQueryConfig(body);
  }


  /**
   * Удаляет конфигурацию запроса
   */
  @Post('remove')
  async removeQueryConfig(
    @Req() request: Request,
    @Body() body: { categoryKey: string; query: string },
  ): Promise<unknown> {
    console.log('=== POST /queries/remove ===');
    console.log('QueriesController.removeQueryConfig called with:', body);

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    console.log('🔍 Проверяем токен для удаления:', token ? 'present' : 'missing');

    // Валидируем JWT токен
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    console.log('✅ JWT токен валиден для удаления, пользователь:', decoded.username);

    return this.queriesService.removeQueryConfig(body.categoryKey, body.query);
  }

  /**
   * Обновляет рекомендуемую цену для запроса
   */
  @Post('recommended-price')
  async updateRecommendedPrice(
    @Req() request: Request,
    @Body()
    body: {
      categoryKey: string;
      query: string;
      recommended_price: number | null;
    },
  ): Promise<unknown> {
    console.log('=== POST /queries/recommended-price ===');
    console.log('QueriesController.updateRecommendedPrice called with:', body);

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    console.log('✅ JWT токен валиден для обновления цены, пользователь:', decoded.username);

    return this.queriesService.updateRecommendedPrice(
      body.categoryKey,
      body.query,
      body.recommended_price,
    );
  }

  /**
   * Обновляет конфигурацию запроса по ID
   */
  @Put(':id')
  async updateQueryConfigById(
    @Req() request: Request,
    @Param('id') id: string,
    @Body()
    body: {
      query: string;
      platform_id?: string | null;
      exactmodels?: string | null;
      platform?: 'ozon' | 'wb' | 'both';
      recommended_price?: number | null;
    },
  ): Promise<QueryConfigResult> {
    console.log('=== PUT /queries/:id ===');
    console.log('QueriesController.updateQueryConfigById called with:', { id, body });
    
    // Валидация ID
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.log('❌ Invalid ID:', id);
      throw new BadRequestException('Invalid query ID');
    }

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    console.log('✅ JWT токен валиден для обновления запроса, пользователь:', decoded.username);

    return this.queriesService.updateQueryConfigById({
      id: numericId,
      ...body,
    });
  }

  /**
   * Удаляет конфигурацию запроса по ID
   */
  @Delete(':id')
  async removeQueryConfigById(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log('=== DELETE /queries/:id ===');
    console.log('QueriesController.removeQueryConfigById called with id:', id);
    
    // Валидация ID
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.log('❌ Invalid ID:', id);
      throw new BadRequestException('Invalid query ID');
    }

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    console.log('✅ JWT токен валиден для удаления запроса, пользователь:', decoded.username);

    await this.queriesService.removeQueryConfigById(numericId);
    return { success: true, message: 'Query config deleted successfully' };
  }

  /**
   * Получает конфигурацию запроса по ID
   */
  @Get(':id')
  async getQueryConfigById(
    @Param('id') id: string,
  ): Promise<QueryConfigResult | null> {
    console.log('=== GET /queries/:id ===');
    console.log('QueriesController.getQueryConfigById called with id:', id);
    
    // Валидация ID
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      console.log('❌ Invalid ID:', id);
      throw new BadRequestException('Invalid query ID');
    }

    return this.queriesService.getQueryConfigById(numericId);
  }

  /**
   * Удаляет конфигурацию запроса по пути
   */
  @Delete('path/:query')
  async removeQueryConfigByPath(
    @Param('query') query: string,
    @Query('categoryKey') categoryKey: string,
  ): Promise<unknown> {
    console.log('=== DELETE /queries/path/:query ===');
    console.log('QueriesController.removeQueryConfigByPath called with:', {
      query,
      categoryKey,
    });
    return this.queriesService.removeQueryConfig(categoryKey, query);
  }
}
