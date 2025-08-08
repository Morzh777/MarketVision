// 🎯 КОНФИГУРАЦИЯ КАТЕГОРИЙ И ПЛАТФОРМ
// Централизованное управление всеми категориями и их параметрами

import { CategoryConfig } from '../services/interfaces/category-config.interface';

// Константы категорий для валидаторов
export const CATEGORY_NAMES = {
  VIDEOCARDS: 'videocards',
  PROCESSORS: 'processors',
  MOTHERBOARDS: 'motherboards',
  PLAYSTATION: 'playstation',
  NINTENDO_SWITCH: 'nintendo_switch',
  STEAM_DECK: 'steam_deck',
  IPHONE: 'iphone'
} as const;

export const CATEGORIES: Record<string, CategoryConfig> = {
  [CATEGORY_NAMES.VIDEOCARDS]: {
    ozon: 'videokarty-15721',
    wb: '3274'
  },
  [CATEGORY_NAMES.PROCESSORS]: {
    ozon: 'protsessory-15726',
    wb: '3698'
  },
  [CATEGORY_NAMES.MOTHERBOARDS]: {
    ozon: 'materinskie-platy-15725',
    wb: '3690'
  },
  [CATEGORY_NAMES.PLAYSTATION]: {
    ozon: 'konsoli-playstation-31751/playstation-79966341',
    wb: '8829'
  },
  playstation_accessories: {
    ozon: 'aksessuary-dlya-igrovyh-pristavok-15810',
    wb: '5923'
  },
  [CATEGORY_NAMES.NINTENDO_SWITCH]: {
    ozon: 'igrovye-pristavki-15801/nintendo-26667979',
    wb: '523'
  },
  [CATEGORY_NAMES.STEAM_DECK]: {
    ozon: 'igrovye-pristavki-15801/valve-84099638',
    wb: '523'
  },
  [CATEGORY_NAMES.IPHONE]: {
    ozon: 'smartfony-15502/apple-26303000',
    wb: '515' // примерный WB id, замени на актуальный если есть
  },
};

// 🎮 ПЛАТФОРМЫ ДЛЯ КОНКРЕТНЫХ ЗАПРОСОВ озон
export const QUERY_PLATFORMS: Record<string, string> = {
  'nintendo switch 2': '101858153',
  'nintendo switch oled': '101858153',
};

// 🎯 МОДЕЛИ ДЛЯ КОНКРЕТНЫХ ЗАПРОСОВ (exactmodels)
export const QUERY_EXACTMODELS: Record<string, string> = {
  'iphone 16 pro': '101218714',
  'iphone 15 pro': '100973685',
}
// 🔧 УТИЛИТЫ ДЛЯ РАБОТЫ С КОНФИГУРАЦИЕЙ
export class CategoryConfigService {
  /**
   * Получить конфигурацию категории
   */
  static getCategoryConfig(category: string): CategoryConfig | undefined {
    return CATEGORIES[category];
  }

  /**
   * Получить платформу для запроса
   */
  static getPlatformForQuery(query: string): string | undefined {
    return QUERY_PLATFORMS[query];
  }

  /**
   * Получить Ozon категорию
   */
  static getOzonCategory(category: string): string | undefined {
    return CATEGORIES[category]?.ozon;
  }

  /**
   * Получить WB категорию
   */
  static getWbCategory(category: string): string | undefined {
    return CATEGORIES[category]?.wb;
  }

  /**
   * Проверить существование категории
   */
  static hasCategory(category: string): boolean {
    return category in CATEGORIES;
  }

  /**
   * Получить все доступные категории
   */
  static getAllCategories(): string[] {
    return Object.keys(CATEGORIES);
  }

  /**
   * Получить все запросы с платформами
   */
  static getQueriesWithPlatforms(): string[] {
    return Object.keys(QUERY_PLATFORMS);
  }

  /**
   * Получить exactmodels для запроса
   */
  static getExactModelsForQuery(query: string): string | undefined {
    return QUERY_EXACTMODELS[query];
  }
} 