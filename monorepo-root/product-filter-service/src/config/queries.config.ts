// 🎯 КОНФИГУРАЦИЯ ЗАПРОСОВ ПО КАТЕГОРИЯМ
// Централизованное управление всеми запросами

export const CATEGORY_QUERIES: Record<string, string[]> = {
  videocards: [
    'RTX5070',
    'RTX5070TI', 
    'RTX5080',
    'RTX5090'
  ],
  processors: [
    '7800X3D',
    '9800X3D',
    '9950X3D'
  ],
  motherboards: [
    'Z790',
    'B760',
    'X870E',
    'B850'
  ],
  playstation: [
    'PlayStation 5 Pro'
  ],
  playstation_accessories: [
    'Дисковод Sony для Playstation 5 Pro',
    'Геймпад PlayStation 5',
  ],
  nintendo_switch: [
    'Nintendo Switch 2',
    'Nintendo Switch OLED'
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