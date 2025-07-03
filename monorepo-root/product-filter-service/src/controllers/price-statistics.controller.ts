import { Controller, Get, Param, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { PriceStatisticsService } from '../services/price-statistics.service';

@Controller('price-statistics')
export class PriceStatisticsController {
  constructor(private readonly priceStatisticsService: PriceStatisticsService) {}

  /**
   * Получение ежедневной статистики изменений цен
   * GET /price-statistics/daily/:date
   */
  @Get('daily/:date')
  async getDailyPriceStatistics(@Param('date') date: string) {
    try {
      // Валидация формата даты (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        throw new HttpException('Неверный формат даты. Используйте YYYY-MM-DD', HttpStatus.BAD_REQUEST);
      }

      return await this.priceStatisticsService.getDailyPriceStatistics(date);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Ошибка получения ежедневной статистики: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получение еженедельной статистики изменений цен
   * GET /price-statistics/weekly/:weekKey
   */
  @Get('weekly/:weekKey')
  async getWeeklyPriceStatistics(@Param('weekKey') weekKey: string) {
    try {
      // Валидация формата недели (YYYY-WW)
      const weekRegex = /^\d{4}-W\d{2}$/;
      if (!weekRegex.test(weekKey)) {
        throw new HttpException('Неверный формат недели. Используйте YYYY-WW', HttpStatus.BAD_REQUEST);
      }

      return await this.priceStatisticsService.getWeeklyPriceStatistics(weekKey);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Ошибка получения еженедельной статистики: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получение статистики изменений цен за сегодня
   * GET /price-statistics/today
   */
  @Get('today')
  async getTodayPriceStatistics() {
    try {
      return await this.priceStatisticsService.getTodayPriceStatistics();
    } catch (error) {
      throw new HttpException(
        `Ошибка получения статистики за сегодня: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получение статистики изменений цен за текущую неделю
   * GET /price-statistics/this-week
   */
  @Get('this-week')
  async getThisWeekPriceStatistics() {
    try {
      return await this.priceStatisticsService.getThisWeekPriceStatistics();
    } catch (error) {
      throw new HttpException(
        `Ошибка получения статистики за текущую неделю: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Очистка старой статистики (старше 30 дней)
   * DELETE /price-statistics/clear-old
   */
  @Delete('clear-old')
  async clearOldStatistics() {
    try {
      const deletedCount = await this.priceStatisticsService.clearOldStatistics();
      
      return {
        success: true,
        deleted_count: deletedCount,
        message: `Очищена старая статистика: ${deletedCount} записей`
      };
    } catch (error) {
      throw new HttpException(
        `Ошибка очистки старой статистики: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получает ежедневную сводку (для бота)
   * GET /price-statistics/daily-summary/:date
   */
  @Get('daily-summary/:date')
  async getDailySummary(@Param('date') date: string) {
    try {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        throw new HttpException('Неверный формат даты. Используйте YYYY-MM-DD', HttpStatus.BAD_REQUEST);
      }

      return await this.priceStatisticsService.getDailySummary(date);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Ошибка получения ежедневной сводки: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получает еженедельный отчет
   * GET /price-statistics/weekly-report/:weekKey
   */
  @Get('weekly-report/:weekKey')
  async getWeeklyReport(@Param('weekKey') weekKey: string) {
    try {
      const weekRegex = /^\d{4}-W\d{2}$/;
      if (!weekRegex.test(weekKey)) {
        throw new HttpException('Неверный формат недели. Используйте YYYY-WW', HttpStatus.BAD_REQUEST);
      }

      return await this.priceStatisticsService.getWeeklyReport(weekKey);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Ошибка получения еженедельного отчета: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получает месячный отчет
   * GET /price-statistics/monthly-report/:year/:month
   */
  @Get('monthly-report/:year/:month')
  async getMonthlyReport(
    @Param('year') year: number,
    @Param('month') month: number
  ) {
    try {
      if (year < 2020 || year > 2030) {
        throw new HttpException('Год должен быть между 2020 и 2030', HttpStatus.BAD_REQUEST);
      }
      if (month < 1 || month > 12) {
        throw new HttpException('Месяц должен быть между 1 и 12', HttpStatus.BAD_REQUEST);
      }

      return await this.priceStatisticsService.getMonthlyReport(year, month);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Ошибка получения месячного отчета: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получает рыночные инсайты
   * GET /price-statistics/market-insights
   */
  @Get('market-insights')
  async getMarketInsights() {
    try {
      return await this.priceStatisticsService.getMarketInsights();
    } catch (error) {
      throw new HttpException(
        `Ошибка получения рыночных инсайтов: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получает сравнение с прошлым периодом
   * GET /price-statistics/comparison/:weekKey
   */
  @Get('comparison/:weekKey')
  async getComparisonReport(@Param('weekKey') weekKey: string) {
    try {
      const weekRegex = /^\d{4}-W\d{2}$/;
      if (!weekRegex.test(weekKey)) {
        throw new HttpException('Неверный формат недели. Используйте YYYY-WW', HttpStatus.BAD_REQUEST);
      }

      return await this.priceStatisticsService.getComparisonReport(weekKey);
  } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Ошибка получения сравнения: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получает все доступные отчеты для бота
   * GET /price-statistics/bot-reports
   */
  @Get('bot-reports')
  async getBotReports() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekKey = this.getWeekKey(new Date());
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const [dailySummary, weeklyReport, monthlyReport, marketInsights, comparison] = await Promise.all([
        this.priceStatisticsService.getDailySummary(today),
        this.priceStatisticsService.getWeeklyReport(weekKey),
        this.priceStatisticsService.getMonthlyReport(currentYear, currentMonth),
        this.priceStatisticsService.getMarketInsights(),
        this.priceStatisticsService.getComparisonReport(weekKey)
      ]);

      return {
        dailySummary,
        weeklyReport,
        monthlyReport,
        marketInsights,
        comparison,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Ошибка получения отчетов для бота: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }
} 