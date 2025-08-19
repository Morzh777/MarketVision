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

// Человеко‑читаемые (нормализованные) названия категорий
const CATEGORY_DISPLAY: Record<string, string> = {
  [CATEGORY_NAMES.PLAYSTATION]: 'PlayStation',
  [CATEGORY_NAMES.NINTENDO_SWITCH]: 'Nintendo Switch',
  [CATEGORY_NAMES.STEAM_DECK]: 'Steam Deck',
  [CATEGORY_NAMES.IPHONE]: 'iPhone',
  [CATEGORY_NAMES.VIDEOCARDS]: 'Видеокарты',
  [CATEGORY_NAMES.PROCESSORS]: 'Процессоры',
  [CATEGORY_NAMES.MOTHERBOARDS]: 'Материнские платы',
};

// 🔗 ГРУППЫ АГРЕГИРОВАННЫХ КАТЕГОРИЙ (удобно расширять)
// ключ — человеко‑читаемое имя, значение — листовые категории (в нижнем регистре)
const MAIN_CATEGORIES: Record<string, string[]> = {
  'Игровые приставки': [
    CATEGORY_NAMES.PLAYSTATION,
    CATEGORY_NAMES.NINTENDO_SWITCH,
    CATEGORY_NAMES.STEAM_DECK
  ],
  'Смартфоны': [CATEGORY_NAMES.IPHONE]
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

  /** Возвращает нормализованное (RU/человеко‑читаемое) имя категории */
  static getCategoryDisplay(category: string | undefined): string | undefined {
    if (!category) return undefined;
    const c = category.toLowerCase();
    return CATEGORY_DISPLAY[c] ?? category;
  }

  /**
   * Возвращает агрегированное название категории для хранения в БД
   * Примеры:
   * - playstation, nintendo_switch, steam_deck -> "Игровые приставки"
   * - iphone -> "Смартфоны"
   */
  static getSuperCategoryDisplay(category: string | undefined): string | undefined {
    if (!category) return undefined;
    const c = category.toLowerCase();
    for (const [display, items] of Object.entries(MAIN_CATEGORIES)) {
      if (items.includes(c)) return display;
    }
    return undefined;
  }

  /**
   * Удобно добавить новые листовые категории к существующей агрегированной группе
   * Пример: addToSuperCategory('Игровые приставки', 'xbox')
   */
  static addToSuperCategory(display: string, ...categories: string[]): void {
    const existing = MAIN_CATEGORIES[display] || [];
    const toAdd = categories.map((c) => c.toLowerCase());
    MAIN_CATEGORIES[display] = Array.from(new Set([...existing, ...toAdd]));
  }

  /**
   * Создать или заменить группу агрегированной категории
   * Пример: setSuperCategoryGroup('Планшеты', ['ipad', 'galaxy_tab'])
   */
  static setSuperCategoryGroup(display: string, categories: string[]): void {
    MAIN_CATEGORIES[display] = Array.from(new Set(categories.map((c) => c.toLowerCase())));
  }
} 