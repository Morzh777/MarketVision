import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class PlaystationValidator extends ProductValidatorBase {
  private readonly PLAYSTATION_RULES: ValidationRules = {
    modelPatterns: [
      /PlayStation\s+(?:5\s+)?(?:Pro\s+)?(\d*)/i,
      /PS5\s+(?:Pro\s+)?(\d*)/i
    ],
    accessoryWords: [
      'контроллер', 'джойстик', 'геймпад', 'dualsense', 'dualshock',
      'кабель', 'шнур', 'адаптер', 'переходник', 'зарядка', 'подставка', 'чехол', 'кейс',
      'игра', 'диск', 'карта памяти', 'наушники', 'гарнитура', 'микрофон',
      'накладки', 'скин', 'сумка', 'дисковод', 'vr', 'portal', 'портативная',
      'станция', 'заряда', 'охлаждение', 'защитный', 'силиконовый', 'кожаный', 
      'пластиковый', 'металлический', 'панель', 'обложка', 'обертка', 'защита'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'playstation') {
      return this.PLAYSTATION_RULES;
    }
    return null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    // ПРИОРИТЕТНАЯ проверка на PS4 (исключаем из результатов PS5)
    if (this.isPS4(name)) {
      return { isValid: false, reason: 'no-model-match', confidence: 0.95 };
    }

    // ПРИОРИТЕТНАЯ проверка на аксессуары
    if (rules.accessoryWords && this.isAccessory(name, rules.accessoryWords)) {
      return { isValid: false, reason: 'accessory', confidence: 0.95 };
    }

    // Дополнительная проверка на аксессуары по паттернам
    if (this.isAccessoryByPattern(name)) {
      return { isValid: false, reason: 'accessory', confidence: 0.9 };
    }

    // Спецлогика для playstation 5 pro
    if (query.trim().toLowerCase().replace(/\s+/g, ' ') === 'playstation 5 pro') {
      const normNameSpaced = name.trim().toLowerCase().replace(/\s+/g, ' ');
      const normNameNoSpace = name.trim().toLowerCase().replace(/\s+/g, '');
      
      // Проверяем на аксессуары ПЕРЕД проверки моделей
      const isAccessory = this.isAccessory(name, rules.accessoryWords || []);
      const isAccessoryByPattern = this.isAccessoryByPattern(name);
      
      if (isAccessory || isAccessoryByPattern) {
        return { isValid: false, reason: 'accessory', confidence: 0.95 };
      }
      
      // Валидные паттерны для PS5 Pro
      const validPatterns = [
        'playstation 5 pro',
        'playstation5pro',
        'ps5 pro',
        'ps5pro',
        'playstation 5 pro slim',
        'playstation5proslim',
        'ps5 pro slim',
        'ps5proslim'
      ];
      
      const hasValidPattern = validPatterns.some(pattern => 
        normNameSpaced.includes(pattern) || normNameNoSpace.includes(pattern)
      );
      
      if (hasValidPattern) {
        return { isValid: true, reason: 'model-match', confidence: 0.95 };
      }
      return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
    }

    // Извлечение моделей
    const models = this.extractModels(name, rules.modelPatterns || []);

    // DEBUG LOG
    console.log('[PLAYSTATION VALIDATOR DEBUG]', {
      query,
      name,
      models,
      isAccessory: this.isAccessory(name, rules.accessoryWords || []),
      isAccessoryByPattern: this.isAccessoryByPattern(name),
      isPS4: this.isPS4(name)
    });

    return this.validateModelMatch(query, models);
  }

  /**
   * Проверка на PS4 (исключаем из результатов PS5)
   */
  private isPS4(name: string): boolean {
    const ps4Patterns = [
      /\b(?:playstation\s*4|ps4|ps\s*4)\b/i,
      /\b(?:4\s+(?:slim|pro))\b/i,
      /\b(?:slim\s+4|pro\s+4)\b/i
    ];

    return ps4Patterns.some(pattern => pattern.test(name));
  }

  /**
   * Проверка на аксессуары по паттернам
   */
  private isAccessoryByPattern(name: string): boolean {
    const normalizedName = this.normalizeToLower(name);
    
    const accessoryPatterns = [
      // Паттерны для аксессуаров с предлогами
      /\b(?:для|на|под)\s+(?:playstation|ps5|ps4|ps3)\b/i,
      
      // Паттерны для комплектов и наборов
      /\b(?:комплект|набор|аксессуар|дополнительно)\b/i,
      
      // Паттерны для игр (но не консоли с играми)
      /\b(?:игра|игры)\b/i,
      
      // Паттерны для VR аксессуаров
      /\b(?:vr|виртуальная\s+реальность)\b/i,
      
      // Паттерны для портативных устройств (но не консоли)
      /\b(?:портативная\s+приставка|portal)\b/i
    ];

    const matchedPatterns = accessoryPatterns.filter(pattern => pattern.test(normalizedName));
    
    return matchedPatterns.length > 0;
  }

  /**
   * Переопределяем извлечение моделей для лучшей обработки PlayStation
   */
  protected extractModels(name: string, patterns: RegExp[]): string[] {
    const models: string[] = [];
    
    // Извлекаем "PlayStation"
    const playstationMatch = name.match(/PlayStation/i);
    if (playstationMatch) {
      models.push(this.normalizeForQuery('playstation'));
    }
    
    // Извлекаем "PS5"
    const ps5Match = name.match(/PS5/i);
    if (ps5Match) {
      models.push(this.normalizeForQuery('ps5'));
    }
    
    // Извлекаем "PS"
    const psMatch = name.match(/PS\s*(\d+)/i);
    if (psMatch) {
      models.push(this.normalizeForQuery(`ps${psMatch[1]}`));
    }
    
    // Извлекаем номер модели (например, 5)
    const modelNumberMatch = name.match(/PlayStation\s*(\d+)/i);
    if (modelNumberMatch) {
      models.push(modelNumberMatch[1]);
    }
    
    // Извлекаем "Pro"
    const proMatch = name.match(/Pro/i);
    if (proMatch) {
      models.push(this.normalizeForQuery('pro'));
    }
    
    // Извлекаем емкость (например, 2TB, 1TB)
    const capacityMatch = name.match(/(\d+)\s*(?:TB|ТБ|GB|ГБ)/i);
    if (capacityMatch) {
      models.push(capacityMatch[1]);
    }
    
    // Извлекаем полные модели
    if (playstationMatch && modelNumberMatch && proMatch) {
      models.push(this.normalizeForQuery(`playstation${modelNumberMatch[1]}pro`));
    }
    
    if (ps5Match && proMatch) {
      models.push(this.normalizeForQuery('ps5pro'));
    }
    
    if (playstationMatch && modelNumberMatch) {
      models.push(this.normalizeForQuery(`playstation${modelNumberMatch[1]}`));
    }
    
    return Array.from(new Set(models)).filter(Boolean);
  }

  /**
   * Переопределяем метод валидации для PlayStation с улучшенной логикой
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    const normQuery = this.normalizeForQuery(query);

    // Жесткая логика для "playstation 5 pro"
    if (normQuery === 'playstation5pro' || normQuery === 'ps5pro' || normQuery === 'playstation5 pro' || normQuery === 'playstation 5 pro') {
      // Только точные совпадения с этими моделями
      const allowedModels = ['playstation5pro', 'ps5pro', 'playstation5 pro', 'playstation 5 pro'];
      const hasExact = models.some(m => allowedModels.includes(m));
      if (hasExact) {
        return { isValid: true, reason: 'model-match', confidence: 0.95 };
      }
      return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
    }

    // Специальная логика для PS5
    if (normQuery.includes('5')) {
      // Если запрашивается PS5, то должны быть модели с "5"
      const hasPS5 = models.includes('5') || models.includes('playstation5') || models.includes('ps5');
      if (hasPS5) {
        return { isValid: true, reason: 'model-match', confidence: 0.95 };
      }
      // Если нет PS5, то это не PS5 модель
      return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
    }

    // Проверяем частичные совпадения для общих случаев
    const queryParts = normQuery.split(/\s+/).filter(Boolean);
    const hasMatchingParts = queryParts.some(part => 
      models.some(model => model.includes(part) || part.includes(model))
    );

    if (hasMatchingParts) {
      return { isValid: true, reason: 'model-match', confidence: 0.8 };
    }

    return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
  }
} 