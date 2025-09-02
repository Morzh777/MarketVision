import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ProductCategory } from './product-validator.base';
import { DbApiHttpClient } from '../../http-clients/db-api.client';
import { MotherboardsValidator } from './category/motherboards.validator';
import { ProcessorsValidator } from './category/processors.validator';
import { VideocardsValidator } from './category/videocards.validator';
import { PlaystationValidator } from './category/playstation.validator';
import { NintendoSwitchValidator } from './category/nintendo-switch.validator';
import { SteamDeckValidator } from './category/steam-deck.validator';
import { IphoneValidator } from './category/iphone.validator';

@Injectable()
export class ValidationFactoryService {
  constructor(
    private readonly motherboardsValidator: MotherboardsValidator,
    private readonly processorsValidator: ProcessorsValidator,
    private readonly videocardsValidator: VideocardsValidator,
    private readonly playstationValidator: PlaystationValidator,
    private readonly nintendoSwitchValidator: NintendoSwitchValidator,
    private readonly steamDeckValidator: SteamDeckValidator,
    private readonly iphoneValidator: IphoneValidator,
    private readonly dbApiClient: DbApiHttpClient,
  ) {}

  async getValidator(category: ProductCategory): Promise<ProductValidatorBase> {
    // Проверяем, что категория существует в DB API
    const validCategories = await this.getAllCategories();
    if (!validCategories.includes(category)) {
      throw new Error(`Неизвестная категория: ${category}. Допустимые: ${validCategories.join(', ')}`);
    }

    switch (category) {
      case 'motherboards':
        return this.motherboardsValidator;
      case 'processors':
        return this.processorsValidator;
      case 'videocards':
        return this.videocardsValidator;
      case 'playstation':
        return this.playstationValidator;
      case 'nintendo_switch':
        return this.nintendoSwitchValidator;
      case 'steam_deck':
        return this.steamDeckValidator;
      case 'iphone':
        return this.iphoneValidator;
      default:
        throw new Error(`Валидатор для категории "${category}" не найден. Добавьте его в ValidationFactoryService.`);
    }
  }

  async validateProducts(products: any[], category: ProductCategory) {
    const validator = await this.getValidator(category);
    return validator.groupAndValidateByQuery(products, category);
  }

  async validateSingleProduct(query: string, productName: string, category: ProductCategory) {
    const validator = await this.getValidator(category);
    return validator.validateSingleProduct(query, productName, category);
  }

  /**
   * Получить все доступные категории из DB API
   */
  async getAllCategories(): Promise<string[]> {
    try {
      // Получаем все категории из DB API
      const categoriesResponse = await this.dbApiClient.getAllCategories();
      // DB API возвращает массив категорий напрямую
      return Array.isArray(categoriesResponse) 
        ? categoriesResponse.map(cat => cat.key) 
        : categoriesResponse.categories?.map(cat => cat.key) || [];
    } catch (error) {
      console.error('Ошибка получения категорий из DB API:', error);
      return [];
    }
  }

  /**
   * Проверить, существует ли категория в DB API
   */
  async hasCategory(category: string): Promise<boolean> {
    const categories = await this.getAllCategories();
    return categories.includes(category);
  }
} 