import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ProductCategory } from './product-validator.base';
import { DbApiHttpClient } from '../../http-clients/db-api.client';
import { TrendAnalysisService } from '../trend-analysis.service';
import { CategoriesService } from '../categories.service';
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
    private readonly trendAnalysisService: TrendAnalysisService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async getValidator(category: ProductCategory): Promise<ProductValidatorBase> {
    // Проверяем, что категория существует в DB API
    const validCategories = await this.categoriesService.getAllCategories();
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
    
    // Получаем рекомендованные цены для всех запросов
    const queries = [...new Set(products.map(p => p.query))];
    const recommendedPrices = await this.dbApiClient.getRecommendedPricesForQueries(queries, category);
    
    // Создаем Map с адаптированными ценами и толерантностью
    const adaptedPrices = new Map<string, { price: number; tolerance: number }>();
    
    // Анализируем тренды и адаптируем цены для каждого запроса
    for (const query of queries) {
      const originalPrice = recommendedPrices.get(query);
      if (originalPrice) {
        try {
          const trendResult = await this.trendAnalysisService.adaptRecommendedPrice(
            query, 
            originalPrice, 
            category
          );
          
          adaptedPrices.set(query, {
            price: trendResult.adaptedRecommendedPrice,
            tolerance: trendResult.dynamicTolerance
          });
          
          // Логируем если цена была адаптирована
          if (trendResult.shouldUpdate) {
            console.log(`🔄 Адаптация цены для "${query}": ${originalPrice}₽ → ${trendResult.adaptedRecommendedPrice}₽ (${trendResult.trend.direction} ${trendResult.trend.percentage.toFixed(2)}%)`);
          }
        } catch (error) {
          console.error(`❌ Ошибка адаптации цены для "${query}":`, error);
          // Используем оригинальную цену при ошибке
          adaptedPrices.set(query, {
            price: originalPrice,
            tolerance: 0.3
          });
        }
      }
    }
    
    // Передаем адаптированные цены в валидатор
    return validator.groupAndValidateByQuery(products, category, adaptedPrices);
  }

  async validateSingleProduct(query: string, productName: string, category: ProductCategory) {
    const validator = await this.getValidator(category);
    return validator.validateSingleProduct(query, productName, category);
  }

  /**
   * Получить все доступные категории из DB API
   */
  async getAllCategories(): Promise<string[]> {
    return this.categoriesService.getAllCategories();
  }

  /**
   * Проверить, существует ли категория в DB API
   */
  async hasCategory(category: string): Promise<boolean> {
    return this.categoriesService.hasCategory(category);
  }
} 