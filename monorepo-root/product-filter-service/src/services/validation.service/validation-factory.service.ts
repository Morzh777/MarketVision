import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ProductCategory } from './product-validator.base';
import { CategoryConfigService } from '../../config/categories.config';
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
  ) {}

  getValidator(category: ProductCategory): ProductValidatorBase {
    // Проверяем, что категория существует в конфигурации
    const validCategories = CategoryConfigService.getAllCategories();
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
    const validator = this.getValidator(category);
    return validator.groupAndValidateByQuery(products, category);
  }

  async validateSingleProduct(query: string, productName: string, category: ProductCategory) {
    const validator = this.getValidator(category);
    return validator.validateSingleProduct(query, productName, category);
  }

  /**
   * Получить все доступные категории из конфигурации
   */
  getAllCategories(): string[] {
    return CategoryConfigService.getAllCategories();
  }

  /**
   * Проверить, существует ли категория
   */
  hasCategory(category: string): boolean {
    return CategoryConfigService.hasCategory(category);
  }
} 