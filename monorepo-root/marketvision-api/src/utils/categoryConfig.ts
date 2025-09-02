// Утилиты для работы с конфигом категорий
// Синхронизировано с product-filter-service/src/config/categories.config.ts

export const QUERY_PLATFORMS: Record<string, string> = {
  'nintendo switch 2': '101858153',
  'nintendo switch oled': '101858153',
};

export const QUERY_EXACTMODELS: Record<string, string> = {
  'iphone 16 pro': '101218714',
  'iphone 15 pro': '100973685',
};

// Готовые запросы для каждой категории
export const CATEGORY_QUERIES: Record<string, string[]> = {
  videocards: ['rtx 5070', 'rtx 5070 ti', 'rtx 5080', 'rtx 5090'],
  processors: ['7800x3d', '9800x3d', '9950x3d'],
  motherboards: ['Z790', 'B760', 'X870E', 'B850', 'B760M-K'],
  playstation: ['playstation 5', 'playstation 5 pro'],
  nintendo_switch: ['nintendo switch 2'],
  steam_deck: ['steam deck oled'],
  iphone: ['iphone 16 pro', 'iphone 16', 'iphone 15 pro', 'iphone 15', 'iphone 16 pro max', 'iphone 15 pro max'],
  playstation_accessories: ['playstation 5 controller', 'playstation 5 headset'],
};

export const CATEGORY_DISPLAY: Record<string, string> = {
  playstation: 'PlayStation',
  nintendo_switch: 'Nintendo Switch',
  steam_deck: 'Steam Deck',
  iphone: 'iPhone',
  videocards: 'Видеокарты',
  processors: 'Процессоры',
  motherboards: 'Материнские платы',
  playstation_accessories: 'Аксессуары PlayStation',
};

/**
 * Получить platform_id для запроса из конфига
 */
export function getPlatformIdForQuery(query: string): string | null {
  const queryLower = query.toLowerCase().trim();
  return QUERY_PLATFORMS[queryLower] || null;
}

/**
 * Получить exactmodels для запроса из конфига
 */
export function getExactModelsForQuery(query: string): string | null {
  const queryLower = query.toLowerCase().trim();
  return QUERY_EXACTMODELS[queryLower] || null;
}

/**
 * Получить отображаемое название категории
 */
export function getCategoryDisplayName(categoryKey: string): string {
  return CATEGORY_DISPLAY[categoryKey] || categoryKey;
}

/**
 * Проверить, есть ли автоматические настройки для запроса
 */
export function hasAutoConfigForQuery(query: string): boolean {
  const queryLower = query.toLowerCase().trim();
  return !!(QUERY_PLATFORMS[queryLower] || QUERY_EXACTMODELS[queryLower]);
}

/**
 * Получить информацию о автоматических настройках для запроса
 */
export function getAutoConfigInfo(query: string): {
  hasPlatformId: boolean;
  hasExactModels: boolean;
  platformId?: string;
  exactModels?: string;
} {
  const queryLower = query.toLowerCase().trim();
  const platformId = QUERY_PLATFORMS[queryLower];
  const exactModels = QUERY_EXACTMODELS[queryLower];
  
  return {
    hasPlatformId: !!platformId,
    hasExactModels: !!exactModels,
    platformId,
    exactModels,
  };
}

/**
 * Получить готовые запросы для категории
 */
export function getQueriesForCategory(categoryKey: string): string[] {
  return CATEGORY_QUERIES[categoryKey] || [];
}

/**
 * Проверить, есть ли готовые запросы для категории
 */
export function hasQueriesForCategory(categoryKey: string): boolean {
  return CATEGORY_QUERIES[categoryKey] && CATEGORY_QUERIES[categoryKey].length > 0;
}
