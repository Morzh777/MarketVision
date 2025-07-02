import { FilterConfig } from '../interfaces/filter.interfaces';

// Предустановленные конфигурации для разных категорий товаров
export class FilterConfigPresets {
  
  // Конфигурация для процессоров
  static readonly CPU_CONFIG: FilterConfig = {
    x3dRules: {
      enabled: true,
      maxPositionInTitle: 30,
      strictModelMatch: true
    },
    intelGenerationRules: {
      enabled: true,
      requireGenerationPrefix: true,
      validateGeneration: true
    },
    amdSeriesRules: {
      enabled: true,
      requireRyzenPrefix: true,
      validateSeries: true
    }
  };

  // Конфигурация для видеокарт
  static readonly GPU_CONFIG: FilterConfig = {
    x3dRules: {
      enabled: false
    },
    rtxRules: {
      enabled: true,
      strictModelMatch: true,
      requireRtxPrefix: true
    }
  };

  // Конфигурация для материнских плат
  static readonly MOTHERBOARD_CONFIG: FilterConfig = {
    x3dRules: {
      enabled: false
    },
    chipsetRules: {
      enabled: true,
      validateChipsetFormat: true,
      requireBrandMatch: false
    }
  };

  // Базовая конфигурация (без специальных правил)
  static readonly BASE_CONFIG: FilterConfig = {
    x3dRules: {
      enabled: false
    }
  };

  // Метод для создания кастомной конфигурации
  static createCustomConfig(overrides: Partial<FilterConfig>): FilterConfig {
    return {
      ...this.BASE_CONFIG,
      ...overrides
    };
  }
}

// Класс для валидации конфигурации
export class FilterConfigValidator {
  
  static validate(config: FilterConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Проверяем X3D правила
    if (config.x3dRules?.enabled) {
      if (config.x3dRules.maxPositionInTitle && config.x3dRules.maxPositionInTitle < 0) {
        errors.push('X3D maxPositionInTitle должен быть положительным числом');
      }
    }

    // Можно добавить другие валидации...

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 