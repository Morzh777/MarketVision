import { CategoryRule } from './category-rule.interface';
import { playstationCustomValidator } from '../validators/playstation.validator';

// Массив аксессуаров удалён. Вся аксессуарная логика теперь только в кастомном валидаторе.

export const PLAYSTATION_RULES: CategoryRule = {
  name: ['playstation 5', 'playstation 5 pro'],
  brands: ['sony', 'playstation'],
  series: ['standard', 'digital', 'slim', 'pro'],
  features: ['825gb', '1tb', '4k', 'консоль'],
  modelPatterns: [
    /ps5\s*pro/i,
    /ps5/i,
    /playstation\s*5\s*pro/i,
    /playstation\s*5/i
  ],
  customValidator: playstationCustomValidator,
  minFeatures: 1,
  minNameLength: 5,
};
