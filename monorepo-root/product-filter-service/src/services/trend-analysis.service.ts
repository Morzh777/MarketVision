import { Injectable, Logger } from '@nestjs/common';
import { DbApiHttpClient } from '../http-clients/db-api.client';

export interface PriceTrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number; // изменение за период в процентах
  confidence: number; // уверенность в тренде (0-1)
  period: number; // дней анализа
  volatility: number; // волатильность (стандартное отклонение)
  dataPoints: number; // количество точек данных
}

export interface TrendAnalysisResult {
  originalRecommendedPrice: number;
  adaptedRecommendedPrice: number;
  dynamicTolerance: number;
  trend: PriceTrend;
  shouldUpdate: boolean; // нужно ли обновить рекомендованную цену
}

@Injectable()
export class TrendAnalysisService {
  private readonly logger = new Logger(TrendAnalysisService.name);

  constructor(private readonly dbApiClient: DbApiHttpClient) {}

  /**
   * Анализирует тренд цен для запроса
   */
  async analyzePriceTrend(query: string, days: number = 30): Promise<PriceTrend> {
    this.logger.log(`🔍 Анализ тренда для запроса: "${query}" за ${days} дней`);
    
    try {
      // Получаем историю цен (больше записей для лучшего анализа)
      const priceHistory = await this.dbApiClient.getPriceHistory(query, days * 2);
      
      if (priceHistory.length < 5) {
        this.logger.warn(`⚠️ Недостаточно данных для анализа тренда: ${priceHistory.length} записей`);
        return {
          direction: 'stable',
          percentage: 0,
          confidence: 0.1,
          period: days,
          volatility: 0,
          dataPoints: priceHistory.length
        };
      }

      // Фильтруем данные за последние N дней
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentData = priceHistory.filter(record => 
        new Date(record.created_at) >= cutoffDate
      );

      if (recentData.length < 3) {
        this.logger.warn(`⚠️ Недостаточно свежих данных: ${recentData.length} записей`);
        return {
          direction: 'stable',
          percentage: 0,
          confidence: 0.2,
          period: days,
          volatility: this.calculateVolatility(recentData.map(r => r.price)),
          dataPoints: recentData.length
        };
      }

      // Сортируем по дате
      recentData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const prices = recentData.map(r => r.price);
      const trend = this.calculateTrend(prices);
      const volatility = this.calculateVolatility(prices);

      this.logger.log(`📊 Тренд: ${trend.direction}, изменение: ${trend.percentage.toFixed(2)}%, уверенность: ${trend.confidence.toFixed(2)}`);

      return {
        ...trend,
        period: days,
        volatility,
        dataPoints: recentData.length
      };

    } catch (error) {
      this.logger.error(`❌ Ошибка анализа тренда для "${query}":`, error);
      return {
        direction: 'stable',
        percentage: 0,
        confidence: 0.1,
        period: days,
        volatility: 0,
        dataPoints: 0
      };
    }
  }

  /**
   * Адаптирует рекомендованную цену на основе тренда
   */
  async adaptRecommendedPrice(
    query: string, 
    originalRecommendedPrice: number,
    category: string
  ): Promise<TrendAnalysisResult> {
    this.logger.log(`🔄 Адаптация рекомендованной цены для "${query}": ${originalRecommendedPrice}₽`);

    try {
      // Анализируем тренд
      const trend = await this.analyzePriceTrend(query, 30);

      // Рассчитываем адаптированную цену
      const adaptedPrice = this.calculateAdaptedPrice(originalRecommendedPrice, trend);
      
      // Рассчитываем динамический допуск
      const dynamicTolerance = this.calculateDynamicTolerance(trend);
      
      // Определяем, нужно ли обновлять рекомендованную цену
      const shouldUpdate = this.shouldUpdateRecommendedPrice(trend, originalRecommendedPrice, adaptedPrice);

      const result: TrendAnalysisResult = {
        originalRecommendedPrice,
        adaptedRecommendedPrice: adaptedPrice,
        dynamicTolerance,
        trend,
        shouldUpdate
      };

      this.logger.log(`✅ Адаптация завершена: ${originalRecommendedPrice}₽ → ${adaptedPrice}₽ (${((adaptedPrice - originalRecommendedPrice) / originalRecommendedPrice * 100).toFixed(2)}%)`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Ошибка адаптации цены для "${query}":`, error);
      
      // Возвращаем оригинальные значения при ошибке
      return {
        originalRecommendedPrice,
        adaptedRecommendedPrice: originalRecommendedPrice,
        dynamicTolerance: 0.3, // стандартный допуск
        trend: {
          direction: 'stable',
          percentage: 0,
          confidence: 0.1,
          period: 30,
          volatility: 0,
          dataPoints: 0
        },
        shouldUpdate: false
      };
    }
  }

  /**
   * Рассчитывает тренд на основе массива цен
   */
  private calculateTrend(prices: number[]): { direction: 'up' | 'down' | 'stable'; percentage: number; confidence: number } {
    if (prices.length < 2) {
      return { direction: 'stable', percentage: 0, confidence: 0 };
    }

    // Простой линейный регрессионный анализ
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = prices;

    // Вычисляем коэффициенты линейной регрессии
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Вычисляем R² для определения уверенности
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    // Вычисляем процентное изменение
    const startPrice = intercept;
    const endPrice = slope * (n - 1) + intercept;
    const percentage = ((endPrice - startPrice) / startPrice) * 100;

    // Определяем направление и уверенность
    const confidence = Math.max(0, Math.min(1, rSquared));
    const threshold = 2; // 2% для определения стабильности

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(percentage) < threshold) {
      direction = 'stable';
    } else if (percentage > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    return {
      direction,
      percentage: Math.abs(percentage),
      confidence
    };
  }

  /**
   * Рассчитывает волатильность (стандартное отклонение)
   */
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  /**
   * Рассчитывает адаптированную рекомендованную цену
   */
  private calculateAdaptedPrice(originalPrice: number, trend: PriceTrend): number {
    if (trend.confidence < 0.5) {
      // Недостаточно уверенности в тренде - используем оригинальную цену
      return originalPrice;
    }

    // Адаптируем цену на основе тренда
    const adjustment = originalPrice * (trend.percentage / 100);
    
    if (trend.direction === 'up') {
      return originalPrice + adjustment;
    } else if (trend.direction === 'down') {
      return originalPrice - adjustment;
    } else {
      return originalPrice;
    }
  }

  /**
   * Рассчитывает динамический допуск на основе тренда
   */
  private calculateDynamicTolerance(trend: PriceTrend): number {
    const baseTolerance = 0.3; // 30% базовый допуск

    // Увеличиваем допуск при высокой волатильности
    const volatilityFactor = Math.min(trend.volatility / 10000, 0.2); // макс +20%

    // Увеличиваем допуск при нестабильности тренда
    const instabilityFactor = trend.confidence < 0.7 ? 0.1 : 0;

    // Уменьшаем допуск при стабильном тренде
    const stabilityFactor = trend.direction === 'stable' && trend.confidence > 0.8 ? -0.05 : 0;

    const finalTolerance = baseTolerance + volatilityFactor + instabilityFactor + stabilityFactor;
    
    // Ограничиваем допуск разумными пределами
    return Math.max(0.15, Math.min(0.6, finalTolerance)); // от 15% до 60%
  }

  /**
   * Определяет, нужно ли обновлять рекомендованную цену
   */
  private shouldUpdateRecommendedPrice(
    trend: PriceTrend, 
    originalPrice: number, 
    adaptedPrice: number
  ): boolean {
    // Обновляем если:
    // 1. Высокая уверенность в тренде (>70%)
    // 2. Значительное изменение цены (>5%)
    // 3. Достаточно данных для анализа (>10 точек)
    
    const priceChangePercent = Math.abs((adaptedPrice - originalPrice) / originalPrice) * 100;
    
    return trend.confidence > 0.7 && 
           priceChangePercent > 5 && 
           trend.dataPoints > 10;
  }
}
