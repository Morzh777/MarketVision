/**
 * Утилиты для санитизации данных
 * Защита от XSS и SQL инъекций
 */

export const sanitizeUtils = {
  /**
   * Базовая санитизация строки с защитой от XSS и SQL инъекций
   * @param value - строка для санитизации
   * @param maxLength - максимальная длина (по умолчанию 100)
   * @returns санитизированная строка
   */
  sanitizeString: (value: string, maxLength: number = 100): string => {
    return value
      .replace(/[<>'";]/g, '') // Удаляем < > ' " ;
      .replace(/javascript:/gi, '') // Удаляем javascript:
      .replace(/on\w+=/gi, '') // Удаляем onload=, onclick= и т.д.
      .replace(/script/gi, '') // Удаляем script
      .replace(/union/gi, '') // Удаляем UNION
      .replace(/drop/gi, '') // Удаляем DROP
      .replace(/insert/gi, '') // Удаляем INSERT
      .replace(/delete/gi, '') // Удаляем DELETE
      .replace(/update/gi, '') // Удаляем UPDATE
      .replace(/select/gi, '') // Удаляем SELECT
      .replace(/--/g, '') // Удаляем комментарии SQL
      .replace(/\/\*/g, '') // Удаляем комментарии SQL
      .replace(/\*\//g, '') // Удаляем комментарии SQL
      .trim()
      .substring(0, maxLength);
  },

  /**
   * Простая санитизация (без SQL инъекций)
   * @param value - строка для санитизации
   * @param maxLength - максимальная длина (по умолчанию 100)
   * @returns санитизированная строка
   */
  sanitizeSimple: (value: string, maxLength: number = 100): string => {
    return value
      .replace(/[<>'";]/g, '')
      .trim()
      .substring(0, maxLength);
  },

  /**
   * Санитизация массива строк
   * @param value - массив для санитизации
   * @param maxLength - максимальная длина каждого элемента (по умолчанию 100)
   * @returns санитизированный массив
   */
  sanitizeArray: (value: any[], maxLength: number = 100): string[] => {
    if (Array.isArray(value)) {
      return value
        .map(item => {
          if (typeof item === 'string') {
            return sanitizeUtils.sanitizeString(item, maxLength);
          }
          return '';
        })
        .filter(item => item.length > 0);
    }
    return [];
  },

  /**
   * Валидация числа с ограничениями
   * @param value - значение для валидации
   * @param min - минимальное значение (по умолчанию 1)
   * @param max - максимальное значение (по умолчанию 100)
   * @param defaultValue - значение по умолчанию (по умолчанию 10)
   * @returns валидированное число
   */
  validateNumber: (value: any, min: number = 1, max: number = 100, defaultValue: number = 10): number => {
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : Math.min(Math.max(num, min), max);
  },

  /**
   * Санитизация email адреса
   * @param value - email для санитизации
   * @returns санитизированный email
   */
  sanitizeEmail: (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[<>'";]/g, '')
      .trim()
      .substring(0, 254); // RFC 5321 ограничение
  },

  /**
   * Санитизация URL
   * @param value - URL для санитизации
   * @returns санитизированный URL
   */
  sanitizeUrl: (value: string): string => {
    return value
      .replace(/[<>'";]/g, '')
      .trim()
      .substring(0, 2048); // Ограничение длины URL
  }
}; 