import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface PriceChange {
  query: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  changeType: 'decrease' | 'increase' | 'no_change';
  productName: string;
  source: string;
}

export interface PriceStatistics {
  date?: string;
  week?: string;
  totalChanges: number;
  decreases: number;
  increases: number;
  totalDecreaseAmount: number;
  totalIncreaseAmount: number;
  changesByCategory: Record<string, {
    total: number;
    decreases: number;
    increases: number;
    totalDecreaseAmount: number;
    totalIncreaseAmount: number;
  }>;
  changesByQuery: Record<string, {
    oldPrice: number;
    newPrice: number;
    changePercent: number;
    changeType: string;
    productName: string;
    source: string;
  }>;
}

@Injectable()
export class PriceStatisticsService {
  private readonly logger = new Logger(PriceStatisticsService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Сохраняет статистику изменений цен в Redis
   */
  async savePriceChanges(priceChanges: PriceChange[]): Promise<void> {
    try {
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const weekKey = this.getWeekKey(now); // YYYY-WW
      
      for (const change of priceChanges) {
        // Сохраняем ежедневную статистику
        const dailyKey = `price_stats:daily:${dateKey}:${change.category}:${change.query}`;
        const dailyData = {
          ...change,
          timestamp: now.toISOString()
        };
        
        await this.redisService.set(dailyKey, JSON.stringify(dailyData));
        
        // Сохраняем еженедельную статистику
        const weeklyKey = `price_stats:weekly:${weekKey}:${change.category}:${change.query}`;
        const weeklyData = {
          ...change,
          timestamp: now.toISOString()
        };
        
        await this.redisService.set(weeklyKey, JSON.stringify(weeklyData));
      }
      
      this.logger.log(`📊 Сохранена статистика изменений цен: ${priceChanges.length} записей`);
    } catch (error) {
      this.logger.error(`❌ Ошибка сохранения статистики изменений цен:`, error);
    }
  }

  /**
   * Получает ключ недели в формате YYYY-WW
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Получает ежедневную статистику изменений цен
   */
  async getDailyPriceStatistics(date: string): Promise<PriceStatistics> {
    try {
      const pattern = `price_stats:daily:${date}:*`;
      const keys = await this.redisService.getAllKeys(pattern);
      
      const changes = [];
      for (const key of keys) {
        const data = await this.redisService.get(key);
        if (data) {
          changes.push(JSON.parse(data));
        }
      }
      
      return this.aggregatePriceStatistics(changes, date);
    } catch (error) {
      this.logger.error(`❌ Ошибка получения ежедневной статистики:`, error);
      return this.getEmptyPriceStatistics(date);
    }
  }

  /**
   * Получает еженедельную статистику изменений цен
   */
  async getWeeklyPriceStatistics(weekKey: string): Promise<PriceStatistics> {
    try {
      const pattern = `price_stats:weekly:${weekKey}:*`;
      const keys = await this.redisService.getAllKeys(pattern);
      
      const changes = [];
      for (const key of keys) {
        const data = await this.redisService.get(key);
        if (data) {
          changes.push(JSON.parse(data));
        }
      }
      
      return this.aggregatePriceStatistics(changes, weekKey);
    } catch (error) {
      this.logger.error(`❌ Ошибка получения еженедельной статистики:`, error);
      return this.getEmptyPriceStatistics(weekKey);
    }
  }

  /**
   * Получает статистику изменений цен за сегодня
   */
  async getTodayPriceStatistics(): Promise<PriceStatistics> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getDailyPriceStatistics(today);
  }

  /**
   * Получает статистику изменений цен за текущую неделю
   */
  async getThisWeekPriceStatistics(): Promise<PriceStatistics> {
    const now = new Date();
    const weekKey = this.getWeekKey(now);
    return await this.getWeeklyPriceStatistics(weekKey);
  }

  /**
   * Агрегирует статистику изменений цен
   */
  private aggregatePriceStatistics(changes: any[], period: string): PriceStatistics {
    const changesByCategory: Record<string, any> = {};
    const changesByQuery: Record<string, any> = {};
    
    let totalChanges = 0;
    let decreases = 0;
    let increases = 0;
    let totalDecreaseAmount = 0;
    let totalIncreaseAmount = 0;
    
    for (const change of changes) {
      totalChanges++;
      
      if (change.changeType === 'decrease') {
        decreases++;
        totalDecreaseAmount += change.oldPrice - change.newPrice;
      } else if (change.changeType === 'increase') {
        increases++;
        totalIncreaseAmount += change.newPrice - change.oldPrice;
      }
      
      // Группировка по категориям
      if (!changesByCategory[change.category]) {
        changesByCategory[change.category] = {
          total: 0,
          decreases: 0,
          increases: 0,
          totalDecreaseAmount: 0,
          totalIncreaseAmount: 0
        };
      }
      
      changesByCategory[change.category].total++;
      if (change.changeType === 'decrease') {
        changesByCategory[change.category].decreases++;
        changesByCategory[change.category].totalDecreaseAmount += change.oldPrice - change.newPrice;
      } else if (change.changeType === 'increase') {
        changesByCategory[change.category].increases++;
        changesByCategory[change.category].totalIncreaseAmount += change.newPrice - change.oldPrice;
      }
      
      // Группировка по query
      changesByQuery[change.query] = {
        oldPrice: change.oldPrice,
        newPrice: change.newPrice,
        changePercent: change.changePercent,
        changeType: change.changeType,
        productName: change.productName,
        source: change.source
      };
    }
    
    return {
      [period.includes('W') ? 'week' : 'date']: period,
      totalChanges,
      decreases,
      increases,
      totalDecreaseAmount,
      totalIncreaseAmount,
      changesByCategory,
      changesByQuery
    };
  }

  /**
   * Возвращает пустую статистику
   */
  private getEmptyPriceStatistics(period: string): PriceStatistics {
    return {
      [period.includes('W') ? 'week' : 'date']: period,
      totalChanges: 0,
      decreases: 0,
      increases: 0,
      totalDecreaseAmount: 0,
      totalIncreaseAmount: 0,
      changesByCategory: {},
      changesByQuery: {}
    };
  }

  /**
   * Очищает старую статистику (старше 30 дней)
   */
  async clearOldStatistics(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      // Получаем все ключи статистики
      const dailyKeys = await this.redisService.getAllKeys('price_stats:daily:*');
      const weeklyKeys = await this.redisService.getAllKeys('price_stats:weekly:*');
      
      let deletedCount = 0;
      
      // Удаляем старые ежедневные записи
      for (const key of dailyKeys) {
        const dateMatch = key.match(/price_stats:daily:(\d{4}-\d{2}-\d{2}):/);
        if (dateMatch && dateMatch[1] < cutoffDate) {
          await this.redisService.delete(key);
          deletedCount++;
        }
      }
      
      // Удаляем старые еженедельные записи (старше 12 недель)
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 * 7 дней
      const cutoffWeek = this.getWeekKey(twelveWeeksAgo);
      
      for (const key of weeklyKeys) {
        const weekMatch = key.match(/price_stats:weekly:(\d{4}-W\d{2}):/);
        if (weekMatch && weekMatch[1] < cutoffWeek) {
          await this.redisService.delete(key);
          deletedCount++;
        }
      }
      
      this.logger.log(`🗑️ Очищена старая статистика: ${deletedCount} записей`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`❌ Ошибка очистки старой статистики:`, error);
      return 0;
    }
  }
} 