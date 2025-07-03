import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
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
   * POST /price-statistics/clear-old
   */
  @Get('clear-old')
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
} 