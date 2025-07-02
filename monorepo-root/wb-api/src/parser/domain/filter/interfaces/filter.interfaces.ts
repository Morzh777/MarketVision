// Интерфейс для настройки специальных правил фильтра
export interface FilterConfig {
  // Правила для X3D процессоров (номер модели должен точно совпадать)
  x3dRules?: {
    enabled: boolean;
    maxPositionInTitle?: number; // X3D должен быть в первых N символах
    strictModelMatch?: boolean; // точное совпадение номера модели
  };
  
  // Правила для Intel процессоров (поколения)
  intelGenerationRules?: {
    enabled: boolean;
    requireGenerationPrefix?: boolean; // требовать "intel" в начале
    validateGeneration?: boolean; // проверять корректность поколения (13xxx, 14xxx)
  };
  
  // Правила для AMD процессоров (серии)
  amdSeriesRules?: {
    enabled: boolean;
    requireRyzenPrefix?: boolean; // требовать "ryzen" в названии
    validateSeries?: boolean; // проверять корректность серии (5xxx, 7xxx, 9xxx)
  };
  
  // Правила для RTX видеокарт
  rtxRules?: {
    enabled: boolean;
    strictModelMatch?: boolean; // 4090 ≠ 4080
    requireRtxPrefix?: boolean; // требовать "rtx" в названии
  };
  
  // Правила для материнских плат (чипсеты)
  chipsetRules?: {
    enabled: boolean;
    validateChipsetFormat?: boolean; // проверять формат B650, X670E и т.д.
    requireBrandMatch?: boolean; // Intel чипсеты только с Intel CPU
  };
}

// Параметры для фильтрации
export interface FilterParams {
  title: string;
  query: string;
  allQueries: string[];
  excludeKeywords: string[];
  config: FilterConfig;
}

// Результат фильтрации
export interface FilterResult {
  isValid: boolean;
  reason?: string; // Причина отклонения для дебага
  appliedRules: string[]; // Какие правила были применены
}

// Интерфейс для валидатора правил
export interface RuleValidator {
  validateRule(title: string, query: string, config: any): boolean | null;
  getRuleName(): string;
}

// Интерфейс основного сервиса фильтрации
export interface IProductFilterService {
  filterProduct(params: FilterParams): FilterResult;
  registerValidator(validator: RuleValidator): void;
} 