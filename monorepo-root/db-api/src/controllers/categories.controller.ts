import {
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
import { CategoriesService } from '../services/categories.service';
import { QueriesService } from '../services/queries.service';
import { JwtService } from '../services/jwt.service';
import { Request } from 'express';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly service: CategoriesService,
    private readonly queriesService: QueriesService,
    private readonly jwtService: JwtService,
  ) {}

  // Получение всех категорий для фронтенда
  @Get()
  async getAllCategories() {
    console.log('[CategoriesController] getAllCategories called');
    const categories = await this.service.getAllCategories();
    console.log('[CategoriesController] Found categories:', categories.length);
    return categories;
  }

  // Aggregate config for product-filter-service
  @Get('config')
  async getCategoryConfig(@Query('categoryKey') categoryKey: string) {
    const categories = (await this.service.listCategories()) as Array<{
      key: string;
    }>;
    const found = categories.find((c) => c.key === categoryKey);
    const category = (found ?? null) as { key: string } | null;
    const queries = (await this.queriesService.listQueryConfigs(
      categoryKey,
    )) as any[];
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

  // Groups
  @Get('groups')
  listGroups() {
    return this.service.listGroups();
  }

  @Post('groups')
  upsertGroup(@Body() body: { display: string }) {
    return this.service.upsertGroup(body.display);
  }

  // Categories - listCategories доступен через другой маршрут

  @Post()
  upsertCategory(
    @Req() request: Request,
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

    // Проверяем авторизацию через временный токен
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

    // Проверяем, что пользователь имеет права администратора
    if (decoded.role !== 'admin') {
      console.log(
        '❌ Недостаточно прав для добавления категории:',
        decoded.role,
      );
      throw new UnauthorizedException(
        'Требуются права администратора для добавления категории',
      );
    }

    console.log('✅ JWT токен валиден, пользователь:', decoded.username);

    return this.service.upsertCategory(body);
  }

  @Put(':id')
  updateCategory(
    @Req() request: Request,
    @Param('id') id: string,
    @Body()
    body: {
      key: string;
      display: string;
      ozon_id?: string | null;
      wb_id?: string | null;
      groupDisplay?: string | null;
    },
  ) {
    console.log('PUT /categories/:id controller called with:', { id, body });

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    console.log(
      '🔍 Проверяем токен для обновления:',
      token ? 'present' : 'missing',
    );

    // Валидируем JWT токен
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    // Проверяем, что пользователь имеет права администратора
    if (decoded.role !== 'admin') {
      console.log(
        '❌ Недостаточно прав для обновления категории:',
        decoded.role,
      );
      throw new UnauthorizedException(
        'Требуются права администратора для обновления категории',
      );
    }

    console.log(
      '✅ JWT токен валиден для обновления, пользователь:',
      decoded.username,
    );

    return this.service.updateCategoryById(parseInt(id), body);
  }

  @Delete(':id')
  async deleteCategory(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<unknown> {
    console.log('=== DELETE /categories/:id ===');
    console.log('CategoriesController.deleteCategory called with id:', id);

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    console.log(
      '🔍 Проверяем токен для удаления:',
      token ? 'present' : 'missing',
    );

    // Валидируем JWT токен
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    // Проверяем, что пользователь имеет права администратора
    if (decoded.role !== 'admin') {
      console.log('❌ Недостаточно прав для удаления категории:', decoded.role);
      throw new UnauthorizedException(
        'Требуются права администратора для удаления категории',
      );
    }

    console.log(
      '✅ JWT токен валиден для удаления, пользователь:',
      decoded.username,
    );
    return this.service.removeCategoryById(parseInt(id));
  }

  @Post('remove')
  async removeCategory(
    @Req() request: Request,
    @Body() body: { key: string },
  ): Promise<unknown> {
    console.log('=== POST /categories/remove ===');
    console.log('CategoriesController.removeCategory called with:', body);

    // Проверяем авторизацию
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header missing or invalid');
      throw new UnauthorizedException('Токен авторизации не найден');
    }

    const token = authHeader.substring(7);
    console.log(
      '🔍 Проверяем токен для удаления:',
      token ? 'present' : 'missing',
    );

    // Валидируем JWT токен
    const decoded = this.jwtService.validateToken(token);
    if (!decoded) {
      console.log('❌ Токен невалиден');
      throw new UnauthorizedException('Невалидный токен авторизации');
    }

    console.log(
      '✅ JWT токен валиден для удаления, пользователь:',
      decoded.username,
    );
    return this.service.removeCategoryByKey(body.key);
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
}
