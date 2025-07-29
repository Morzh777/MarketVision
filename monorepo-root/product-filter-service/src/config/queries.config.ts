// 🎯 КОНФИГУРАЦИЯ ЗАПРОСОВ ПО КАТЕГОРИЯМ
// Централизованное управление всеми запросами

export const CATEGORY_QUERIES: Record<string, string[]> = {
  videocards: [
    'rtx 5070',
    'rtx 5070 ti', 
    'rtx 5080',
    'rtx 5090'
  ],
  processors: [
    '7800x3d',
    '9800x3d',
    '9950x3d'
  ],
  motherboards: [
    'Z790',
    'B760',
    'X870E',
    'B850'
  ],
  playstation: [
    'playstation 5',
    'playstation 5 pro'
  ],
  playstation_accessories: [
    'Дисковод Sony для Playstation 5 Pro'
  ],
  nintendo_switch: [
    'nintendo switch 2',
    'nintendo switch oled'
  ],
  steam_deck: [
    'steam deck oled'
  ],
  iphone: [
    'iphone 16 pro',
    'iphone 16 pro max',
    'iphone 16',
    'iphone 16 plus',
  ]
};

// 🔧 УТИЛИТЫ ДЛЯ РАБОТЫ С ЗАПРОСАМИ
export class QueryConfigService {
  /**
   * Получить запросы для категории
   */
  static getQueriesForCategory(category: string): string[] {
    return CATEGORY_QUERIES[category] || [];
  }

  /**
   * Проверить существование категории
   */
  static hasCategory(category: string): boolean {
    return category in CATEGORY_QUERIES;
  }

  /**
   * Получить все доступные категории
   */
  static getAllCategories(): string[] {
    return Object.keys(CATEGORY_QUERIES);
  }

  /**
   * Получить категорию по запросу
   */
  static getCategoryByQuery(query: string): string | undefined {
    for (const [category, queries] of Object.entries(CATEGORY_QUERIES)) {
      if (queries.includes(query)) {
        return category;
      }
    }
    return undefined;
  }

  /**
   * Получить все запросы
   */
  static getAllQueries(): string[] {
    return Object.values(CATEGORY_QUERIES).flat();
  }
} 