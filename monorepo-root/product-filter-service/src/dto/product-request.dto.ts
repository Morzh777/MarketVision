import { IsArray, IsString, IsOptional, ArrayMinSize, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

// Список разрешенных категорий
const ALLOWED_CATEGORIES = [
  'videocards',
  'processors', 
  'motherboards',
  'playstation',
  'nintendo_switch',
  'steam_deck',
  'iphone'
];

export class ProductRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => {
    // Санитизация от XSS и SQL injection
    if (Array.isArray(value)) {
      return value.map(query => {
        if (typeof query === 'string') {
          // Удаляем опасные символы
          return query
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
            .substring(0, 100); // Ограничиваем длину
        }
        return '';
      }).filter(query => query.length > 0);
    }
    return [];
  })
  queries: string[];

  @IsString()
  @IsIn(ALLOWED_CATEGORIES, { message: 'Недопустимая категория' })
  @Transform(({ value }) => {
    // Санитизация категории
    if (typeof value === 'string') {
      return value
        .replace(/[<>'";]/g, '')
        .toLowerCase()
        .trim();
    }
    return value;
  })
  category: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    // Санитизация exclude_keywords
    if (Array.isArray(value)) {
      return value.map(keyword => {
        if (typeof keyword === 'string') {
          return keyword
            .replace(/[<>'";]/g, '')
            .trim()
            .substring(0, 50);
        }
        return '';
      }).filter(keyword => keyword.length > 0);
    }
    return [];
  })
  exclude_keywords?: string[];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    // Санитизация exactmodels
    if (typeof value === 'string') {
      return value
        .replace(/[<>'";]/g, '')
        .trim()
        .substring(0, 200);
    }
    return value;
  })
  exactmodels?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    // Санитизация опциональных полей
    if (typeof value === 'string') {
      return value
        .replace(/[<>'";]/g, '')
        .substring(0, 200)
        .trim();
    }
    return value;
  })
  sortBy?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Валидация числовых значений
    const num = parseInt(value);
    return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 100);
  })
  limit?: number;
} 