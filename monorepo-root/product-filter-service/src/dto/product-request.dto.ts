import { IsArray, IsString, IsOptional, ArrayMinSize, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeUtils } from '../utils/sanitize.utils';

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
  @Transform(({ value }) => sanitizeUtils.sanitizeArray(value, 100))
  queries: string[];

  @IsString()
  @IsIn(ALLOWED_CATEGORIES, { message: 'Недопустимая категория' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeUtils.sanitizeSimple(value).toLowerCase();
    }
    return value;
  })
  category: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => sanitizeUtils.sanitizeArray(value, 50))
  exclude_keywords?: string[];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeUtils.sanitizeSimple(value, 200);
    }
    return value;
  })
  exactmodels?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeUtils.sanitizeSimple(value, 200);
    }
    return value;
  })
  sortBy?: string;

  @IsOptional()
  @Transform(({ value }) => sanitizeUtils.validateNumber(value, 1, 100, 10))
  limit?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeUtils.sanitizeSimple(value, 200);
    }
    return value;
  })
  platform_id?: string;

} 