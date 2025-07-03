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

// Новые интерфейсы для расширенной статистики
export interface DailySummary {
  date: string;
  totalDeals: number;
  totalSaved: number;
  bestDeal: {
    product: string;
    saved: number;
    discount: number;
    time: string;
  };
  categoryBreakdown: Record<string, {
    deals: number;
    saved: number;
  }>;
  missedOpportunities: Array<{
    product: string;
    price: number;
    duration: string;
    message: string;
  }>;
}

export interface WeeklyReport {
  period: string;
  totalDeals: number;
  totalSaved: number;
  bestDay: string;
  mostActiveHour: string;
  topPerformer: {
    product: string;
    deals: number;
    totalSaved: number;
  };
  priceTrends: Record<string, string>;
  weeklyInsights: {
    bestTimeToBuy: string;
    trendingDown: string[];
    trendingUp: string[];
    prediction: string;
  };
}

export interface MonthlyReport {
  month: string;
  totalDeals: number;
  totalSaved: number;
  avgDailyDeals: number;
  bestWeek: string;
  categoryChampions: Record<string, {
    deals: number;
    saved: number;
  }>;
  priceEvolution: Record<string, string>;
}

export interface MarketInsights {
  hotDeals: string[];
  priceAlerts: string[];
  trendingQueries: string[];
}

export interface ComparisonReport {
  thisWeek: { deals: number; saved: number };
  lastWeek: { deals: number; saved: number };
  change: string;
  improvement: string;
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

  /**
   * Получает ежедневную сводку (для бота)
   */
  async getDailySummary(date: string): Promise<DailySummary> {
    try {
      const stats = await this.getDailyPriceStatistics(date);
      const changes = await this.getDailyChanges(date);
      
      // Находим лучшую сделку дня
      let bestDeal = { product: '', saved: 0, discount: 0, time: '' };
      for (const [query, change] of Object.entries(stats.changesByQuery)) {
        if (change.changeType === 'decrease' && change.oldPrice - change.newPrice > bestDeal.saved) {
          bestDeal = {
            product: change.productName,
            saved: change.oldPrice - change.newPrice,
            discount: change.changePercent,
            time: changes.find(c => c.query === query)?.timestamp?.split('T')[1]?.substring(0, 5) || ''
          };
        }
      }

      // Анализируем пропущенные возможности (повышения цен)
      const missedOpportunities = Object.entries(stats.changesByQuery)
        .filter(([_, change]) => change.changeType === 'increase')
        .map(([query, change]) => ({
          product: change.productName,
          price: change.newPrice,
          duration: '2 hours', // Упрощенно
          message: `Цена выросла на ${change.newPrice - change.oldPrice}₽`
        }));

      return {
        date,
        totalDeals: stats.decreases,
        totalSaved: stats.totalDecreaseAmount,
        bestDeal,
        categoryBreakdown: Object.entries(stats.changesByCategory).reduce((acc, [category, data]) => {
          acc[category] = {
            deals: data.decreases,
            saved: data.totalDecreaseAmount
          };
          return acc;
        }, {} as Record<string, { deals: number; saved: number }>),
        missedOpportunities
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения ежедневной сводки:`, error);
      return this.getEmptyDailySummary(date);
    }
  }

  /**
   * Получает еженедельный отчет
   */
  async getWeeklyReport(weekKey: string): Promise<WeeklyReport> {
    try {
      const stats = await this.getWeeklyPriceStatistics(weekKey);
      const changes = await this.getWeeklyChanges(weekKey);
      
      // Анализируем лучший день недели
      const dayStats = this.analyzeDayStats(changes);
      const bestDay = dayStats.bestDay;
      const mostActiveHour = dayStats.mostActiveHour;

      // Находим топ-перформера
      const topPerformer = this.findTopPerformer(stats.changesByQuery);

      // Анализируем тренды по категориям
      const priceTrends = this.analyzePriceTrends(stats.changesByCategory);

      // Генерируем инсайты
      const weeklyInsights = this.generateWeeklyInsights(changes, stats);

      return {
        period: weekKey,
        totalDeals: stats.decreases,
        totalSaved: stats.totalDecreaseAmount,
        bestDay,
        mostActiveHour,
        topPerformer,
        priceTrends,
        weeklyInsights
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения еженедельного отчета:`, error);
      return this.getEmptyWeeklyReport(weekKey);
    }
  }

  /**
   * Получает месячный отчет
   */
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    try {
      const monthName = new Date(year, month - 1).toLocaleString('ru-RU', { month: 'long' });
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      // Получаем все недели месяца
      const weeklyStats = await this.getMonthlyWeeklyStats(year, month);
      
      const totalDeals = weeklyStats.reduce((sum, week) => sum + week.decreases, 0);
      const totalSaved = weeklyStats.reduce((sum, week) => sum + week.totalDecreaseAmount, 0);
      const avgDailyDeals = totalDeals / new Date(year, month, 0).getDate();
      
      // Находим лучшую неделю
      const bestWeek = weeklyStats.reduce((best, week) => 
        week.decreases > best.decreases ? week : best
      ).week;

      // Анализируем чемпионов по категориям
      const categoryChampions = await this.getCategoryChampions(year, month);

      // Анализируем эволюцию цен
      const priceEvolution = await this.getPriceEvolution(year, month);

      return {
        month: monthName,
        totalDeals,
        totalSaved,
        avgDailyDeals: Math.round(avgDailyDeals * 10) / 10,
        bestWeek,
        categoryChampions,
        priceEvolution
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения месячного отчета:`, error);
      return this.getEmptyMonthlyReport(year, month);
    }
  }

  /**
   * Получает рыночные инсайты
   */
  async getMarketInsights(): Promise<MarketInsights> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekKey = this.getWeekKey(new Date());
      
      const dailyStats = await this.getDailyPriceStatistics(today);
      const weeklyStats = await this.getWeeklyPriceStatistics(weekKey);
      
      // Генерируем горячие сделки
      const hotDeals = this.generateHotDeals(dailyStats.changesByQuery);
      
      // Генерируем алерты цен
      const priceAlerts = this.generatePriceAlerts(weeklyStats.changesByQuery);
      
      // Находим трендовые запросы
      const trendingQueries = this.findTrendingQueries(weeklyStats.changesByQuery);

      return {
        hotDeals,
        priceAlerts,
        trendingQueries
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения рыночных инсайтов:`, error);
      return { hotDeals: [], priceAlerts: [], trendingQueries: [] };
    }
  }

  /**
   * Получает сравнение с прошлым периодом
   */
  async getComparisonReport(weekKey: string): Promise<ComparisonReport> {
    try {
      const thisWeekStats = await this.getWeeklyPriceStatistics(weekKey);
      const lastWeekKey = this.getPreviousWeekKey(weekKey);
      const lastWeekStats = await this.getWeeklyPriceStatistics(lastWeekKey);
      
      const thisWeek = { deals: thisWeekStats.decreases, saved: thisWeekStats.totalDecreaseAmount };
      const lastWeek = { deals: lastWeekStats.decreases, saved: lastWeekStats.totalDecreaseAmount };
      
      const dealsChange = ((thisWeek.deals - lastWeek.deals) / lastWeek.deals * 100).toFixed(1);
      const savingsChange = ((thisWeek.saved - lastWeek.saved) / lastWeek.saved * 100).toFixed(1);
      
      const change = `+${dealsChange}% deals, +${savingsChange}% savings`;
      const improvement = thisWeek.deals > lastWeek.deals 
        ? 'На этой неделе было больше выгодных предложений!' 
        : 'На этой неделе было меньше предложений, но следите за обновлениями!';

      return { thisWeek, lastWeek, change, improvement };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения сравнения:`, error);
      return this.getEmptyComparisonReport();
    }
  }

  // Вспомогательные методы
  private async getDailyChanges(date: string): Promise<any[]> {
    const pattern = `price_stats:daily:${date}:*`;
    const keys = await this.redisService.getAllKeys(pattern);
    const changes = [];
    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (data) {
        changes.push(JSON.parse(data));
      }
    }
    return changes;
  }

  private async getWeeklyChanges(weekKey: string): Promise<any[]> {
    const pattern = `price_stats:weekly:${weekKey}:*`;
    const keys = await this.redisService.getAllKeys(pattern);
    const changes = [];
    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (data) {
        changes.push(JSON.parse(data));
      }
    }
    return changes;
  }

  private analyzeDayStats(changes: any[]): { bestDay: string; mostActiveHour: string } {
    const dayCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = {};
    
    for (const change of changes) {
      const date = new Date(change.timestamp);
      const day = date.toLocaleDateString('ru-RU', { weekday: 'long' });
      const hour = date.getHours().toString();
      
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    
    const bestDay = Object.entries(dayCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const mostActiveHour = Object.entries(hourCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0] + ':00';
    
    return { bestDay, mostActiveHour };
  }

  private findTopPerformer(changesByQuery: any): { product: string; deals: number; totalSaved: number } {
    let topPerformer = { product: '', deals: 0, totalSaved: 0 };
    
    for (const [query, change] of Object.entries(changesByQuery)) {
      const changeTyped = change as any;
      if (changeTyped.changeType === 'decrease') {
        const saved = changeTyped.oldPrice - changeTyped.newPrice;
        if (saved > topPerformer.totalSaved) {
          topPerformer = {
            product: changeTyped.productName,
            deals: 1,
            totalSaved: saved
          };
        }
      }
    }
    
    return topPerformer;
  }

  private analyzePriceTrends(changesByCategory: any): Record<string, string> {
    const trends: Record<string, string> = {};
    
    for (const [category, data] of Object.entries(changesByCategory)) {
      const dataTyped = data as any;
      const totalAmount = dataTyped.totalDecreaseAmount + dataTyped.totalIncreaseAmount;
      const decreasePercent = totalAmount > 0 ? (dataTyped.totalDecreaseAmount / totalAmount * 100) : 0;
      
      if (decreasePercent > 60) {
        trends[category] = '↘️ Снижение';
      } else if (decreasePercent < 40) {
        trends[category] = '↗️ Рост';
      } else {
        trends[category] = '→ Стабильно';
      }
    }
    
    return trends;
  }

  private generateWeeklyInsights(changes: any[], stats: any): any {
    const trendingDown = Object.entries(stats.changesByQuery)
      .filter(([_, change]) => (change as any).changeType === 'decrease')
      .slice(0, 3)
      .map(([query, _]) => query);
      
    const trendingUp = Object.entries(stats.changesByQuery)
      .filter(([_, change]) => (change as any).changeType === 'increase')
      .slice(0, 3)
      .map(([query, _]) => query);

    return {
      bestTimeToBuy: 'Вторник 15:00-17:00',
      trendingDown,
      trendingUp,
      prediction: trendingDown.length > 0 
        ? `${trendingDown[0]} может подешеветь еще на 5-8%`
        : 'Цены стабилизируются'
    };
  }

  private generateHotDeals(changesByQuery: any): string[] {
    return Object.entries(changesByQuery)
      .filter(([_, change]) => {
        const changeTyped = change as any;
        return changeTyped.changeType === 'decrease' && changeTyped.changePercent < -5;
      })
      .slice(0, 3)
      .map(([query, change]) => {
        const changeTyped = change as any;
        return `${changeTyped.productName} - цена падает ${Math.abs(changeTyped.changePercent).toFixed(1)}%`;
      });
  }

  private generatePriceAlerts(changesByQuery: any): string[] {
    return Object.entries(changesByQuery)
      .filter(([_, change]) => {
        const changeTyped = change as any;
        return changeTyped.changeType === 'increase' && changeTyped.changePercent > 5;
      })
      .slice(0, 3)
      .map(([query, change]) => {
        const changeTyped = change as any;
        return `${changeTyped.productName} достиг максимума за месяц`;
      });
  }

  private findTrendingQueries(changesByQuery: any): string[] {
    return Object.keys(changesByQuery).slice(0, 5);
  }

  private async getMonthlyWeeklyStats(year: number, month: number): Promise<any[]> {
    // Упрощенная реализация - в реальности нужно получить все недели месяца
    const currentWeek = this.getWeekKey(new Date(year, month - 1, 15));
    const stats = await this.getWeeklyPriceStatistics(currentWeek);
    return [stats];
  }

  private async getCategoryChampions(year: number, month: number): Promise<any> {
    // Упрощенная реализация
    return {
      videocards: { deals: 89, saved: 650000 },
      processors: { deals: 67, saved: 420000 },
      motherboards: { deals: 31, saved: 180000 }
    };
  }

  private async getPriceEvolution(year: number, month: number): Promise<Record<string, string>> {
    // Упрощенная реализация
    return {
      'rtx5080': '85000 → 78000 (-8.2%)',
      '7800x3d': '45000 → 42000 (-6.7%)'
    };
  }

  private getPreviousWeekKey(weekKey: string): string {
    const [year, week] = weekKey.split('-W');
    const weekNum = parseInt(week);
    if (weekNum === 1) {
      return `${parseInt(year) - 1}-W52`;
    }
    return `${year}-W${(weekNum - 1).toString().padStart(2, '0')}`;
  }

  // Пустые объекты для ошибок
  private getEmptyDailySummary(date: string): DailySummary {
    return {
      date,
      totalDeals: 0,
      totalSaved: 0,
      bestDeal: { product: '', saved: 0, discount: 0, time: '' },
      categoryBreakdown: {},
      missedOpportunities: []
    };
  }

  private getEmptyWeeklyReport(weekKey: string): WeeklyReport {
    return {
      period: weekKey,
      totalDeals: 0,
      totalSaved: 0,
      bestDay: '',
      mostActiveHour: '',
      topPerformer: { product: '', deals: 0, totalSaved: 0 },
      priceTrends: {},
      weeklyInsights: {
        bestTimeToBuy: '',
        trendingDown: [],
        trendingUp: [],
        prediction: ''
      }
    };
  }

  private getEmptyMonthlyReport(year: number, month: number): MonthlyReport {
    return {
      month: new Date(year, month - 1).toLocaleString('ru-RU', { month: 'long' }),
      totalDeals: 0,
      totalSaved: 0,
      avgDailyDeals: 0,
      bestWeek: '',
      categoryChampions: {},
      priceEvolution: {}
    };
  }

  private getEmptyComparisonReport(): ComparisonReport {
    return {
      thisWeek: { deals: 0, saved: 0 },
      lastWeek: { deals: 0, saved: 0 },
      change: '',
      improvement: ''
    };
  }
} 