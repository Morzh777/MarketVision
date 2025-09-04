import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbApiHttpClient } from '../http-clients/db-api.client';
import { TrendAnalysisService, TrendAnalysisResult } from './trend-analysis.service';
import { CategoriesService } from './categories.service';

@Injectable()
export class PriceUpdateService {
  private readonly logger = new Logger(PriceUpdateService.name);

  constructor(
    private readonly dbApiClient: DbApiHttpClient,
    private readonly trendAnalysisService: TrendAnalysisService,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Автоматическое обновление рекомендованных цен каждые 6 часов
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async updateRecommendedPrices(): Promise<void> {
    this.logger.log('🔄 Запуск автоматического обновления рекомендованных цен');
    
    try {
      // Получаем все категории
      const categories = await this.categoriesService.getAllCategories();
      
      for (const category of categories) {
        await this.updatePricesForCategory(category);
      }
      
      this.logger.log('✅ Автоматическое обновление рекомендованных цен завершено');
    } catch (error) {
      this.logger.error('❌ Ошибка при автоматическом обновлении цен:', error);
    }
  }

  /**
   * Обновляет рекомендованные цены для конкретной категории
   */
  async updatePricesForCategory(categoryKey: string): Promise<void> {
    this.logger.log(`📊 Обновление цен для категории: ${categoryKey}`);
    
    try {
      // Получаем все запросы для категории
      const queriesResponse = await this.dbApiClient.getRecommendedPricesForQueries([], categoryKey);
      const queries = Array.from(queriesResponse.keys());
      
      if (queries.length === 0) {
        this.logger.log(`⚠️ Нет запросов для категории ${categoryKey}`);
        return;
      }

      let updatedCount = 0;
      let errorCount = 0;

      for (const query of queries) {
        try {
          const originalPrice = queriesResponse.get(query);
          if (!originalPrice) continue;

          // Анализируем тренд и адаптируем цену
          const trendResult = await this.trendAnalysisService.adaptRecommendedPrice(
            query, 
            originalPrice, 
            categoryKey
          );

          // Обновляем цену только если система рекомендует это
          if (trendResult.shouldUpdate) {
            await this.updateQueryRecommendedPrice(categoryKey, query, trendResult.adaptedRecommendedPrice);
            updatedCount++;
            
            this.logger.log(`✅ Обновлена цена для "${query}": ${originalPrice}₽ → ${trendResult.adaptedRecommendedPrice}₽ (${trendResult.trend.direction} ${trendResult.trend.percentage.toFixed(2)}%)`);
          } else {
            this.logger.debug(`⏭️ Пропущено обновление для "${query}": недостаточно данных или стабильный тренд`);
          }

        } catch (error) {
          errorCount++;
          this.logger.error(`❌ Ошибка обновления цены для "${query}":`, error);
        }
      }

      this.logger.log(`📈 Категория ${categoryKey}: обновлено ${updatedCount} цен, ошибок ${errorCount}`);

    } catch (error) {
      this.logger.error(`❌ Ошибка обновления цен для категории ${categoryKey}:`, error);
    }
  }

  /**
   * Обновляет рекомендованную цену для конкретного запроса
   */
  private async updateQueryRecommendedPrice(
    categoryKey: string, 
    query: string, 
    newRecommendedPrice: number
  ): Promise<void> {
    try {
      const response = await fetch(`${this.dbApiClient['baseURL']}/categories/queries/recommended-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryKey,
          query,
          recommended_price: newRecommendedPrice
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug(`✅ Рекомендованная цена обновлена для "${query}": ${newRecommendedPrice}₽`);

    } catch (error) {
      this.logger.error(`❌ Ошибка обновления рекомендованной цены для "${query}":`, error);
      throw error;
    }
  }

  /**
   * Ручное обновление цен для конкретного запроса (для тестирования)
   */
  async updatePriceForQuery(categoryKey: string, query: string): Promise<TrendAnalysisResult | null> {
    this.logger.log(`🔧 Ручное обновление цены для "${query}" в категории ${categoryKey}`);
    
    try {
      // Получаем текущую рекомендованную цену
      const recommendedPrices = await this.dbApiClient.getRecommendedPricesForQueries([query], categoryKey);
      const originalPrice = recommendedPrices.get(query);
      
      if (!originalPrice) {
        this.logger.warn(`⚠️ Не найдена рекомендованная цена для "${query}"`);
        return null;
      }

      // Анализируем тренд и адаптируем цену
      const trendResult = await this.trendAnalysisService.adaptRecommendedPrice(
        query, 
        originalPrice, 
        categoryKey
      );

      // Обновляем цену
      if (trendResult.shouldUpdate) {
        await this.updateQueryRecommendedPrice(categoryKey, query, trendResult.adaptedRecommendedPrice);
      }

      return trendResult;

    } catch (error) {
      this.logger.error(`❌ Ошибка ручного обновления цены для "${query}":`, error);
      throw error;
    }
  }

  /**
   * Получает статистику обновлений цен
   */
  async getUpdateStats(): Promise<{
    lastUpdate: Date;
    totalQueries: number;
    updatedQueries: number;
    errorQueries: number;
  }> {
    // Здесь можно добавить логику для отслеживания статистики обновлений
    // Пока возвращаем базовую информацию
    return {
      lastUpdate: new Date(),
      totalQueries: 0,
      updatedQueries: 0,
      errorQueries: 0
    };
  }
}
