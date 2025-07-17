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
    const cases = [
      {
        when: () => category === 'playstation',
        result: this.PLAYSTATION_RULES
      }
    ];

    return cases.find(c => c.when())?.result ?? null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    const normQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
    const models = this.extractModels(name, rules.modelPatterns || []);

    const cases = [
      {
        when: () => this.isPS4(name),
        result: { isValid: false, reason: 'no-model-match', confidence: 0.95 }
      },
      {
        when: () => rules.accessoryWords && this.isAccessory(name, rules.accessoryWords),
        result: { isValid: false, reason: 'accessory', confidence: 0.95 }
      },
      {
        when: () => this.isAccessoryByPattern(name),
        result: { isValid: false, reason: 'accessory', confidence: 0.9 }
      },
      {
        when: () => normQuery === 'playstation 5 pro' && this.isValidPS5Pro(name),
        result: { isValid: true, reason: 'model-match', confidence: 0.95 }
      },
      {
        when: () => normQuery === 'playstation 5 pro',
        result: { isValid: false, reason: 'no-model-match', confidence: 0.1 }
      },
      {
        when: () => this.validateModelMatch(query, models).isValid,
        result: { isValid: true, reason: 'model-match', confidence: 0.95 }
      }
    ];

    // DEBUG LOG
    console.log('[PLAYSTATION VALIDATOR DEBUG]', {
      query,
      name,
      models,
      isAccessory: this.isAccessory(name, rules.accessoryWords || []),
      isAccessoryByPattern: this.isAccessoryByPattern(name),
      isPS4: this.isPS4(name)
    });

    return cases.find(c => c.when())?.result ?? { 
      isValid: false, 
      reason: 'no-model-match', 
      confidence: 0.1 
    };
  }

  /**
   * Проверка валидности PS5 Pro
   */
  private isValidPS5Pro(name: string): boolean {
    const normNameSpaced = name.trim().toLowerCase().replace(/\s+/g, ' ');
    const normNameNoSpace = name.trim().toLowerCase().replace(/\s+/g, '');
    
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
    
    return validPatterns.some(pattern => 
      normNameSpaced.includes(pattern) || normNameNoSpace.includes(pattern)
    );
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
    const playstationCases = [
      {
        when: () => playstationMatch !== null,
        result: () => models.push(this.normalizeForQuery('playstation'))
      }
    ];
    playstationCases.find(c => c.when())?.result();
    
    // Извлекаем "PS5"
    const ps5Match = name.match(/PS5/i);
    const ps5Cases = [
      {
        when: () => ps5Match !== null,
        result: () => models.push(this.normalizeForQuery('ps5'))
      }
    ];
    ps5Cases.find(c => c.when())?.result();
    
    // Извлекаем "PS"
    const psMatch = name.match(/PS\s*(\d+)/i);
    const psCases = [
      {
        when: () => psMatch !== null,
        result: () => models.push(this.normalizeForQuery(`ps${psMatch[1]}`))
      }
    ];
    psCases.find(c => c.when())?.result();
    
    // Извлекаем номер модели (например, 5)
    const modelNumberMatch = name.match(/PlayStation\s*(\d+)/i);
    const modelNumberCases = [
      {
        when: () => modelNumberMatch !== null,
        result: () => models.push(modelNumberMatch[1])
      }
    ];
    modelNumberCases.find(c => c.when())?.result();
    
    // Извлекаем "Pro"
    const proMatch = name.match(/Pro/i);
    const proCases = [
      {
        when: () => proMatch !== null,
        result: () => models.push(this.normalizeForQuery('pro'))
      }
    ];
    proCases.find(c => c.when())?.result();
    
    // Извлекаем емкость (например, 2TB, 1TB)
    const capacityMatch = name.match(/(\d+)\s*(?:TB|ТБ|GB|ГБ)/i);
    const capacityCases = [
      {
        when: () => capacityMatch !== null,
        result: () => models.push(capacityMatch[1])
      }
    ];
    capacityCases.find(c => c.when())?.result();
    
    // Извлекаем полные модели
    const fullModelCases = [
      {
        when: () => playstationMatch !== null && modelNumberMatch !== null && proMatch !== null,
        result: () => models.push(this.normalizeForQuery(`playstation${modelNumberMatch[1]}pro`))
      },
      {
        when: () => ps5Match !== null && proMatch !== null,
        result: () => models.push(this.normalizeForQuery('ps5pro'))
      },
      {
        when: () => playstationMatch !== null && modelNumberMatch !== null,
        result: () => models.push(this.normalizeForQuery(`playstation${modelNumberMatch[1]}`))
      }
    ];
    fullModelCases.find(c => c.when())?.result();
    
    return Array.from(new Set(models)).filter(Boolean);
  }

  /**
   * Переопределяем метод валидации для PlayStation с улучшенной логикой
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    const normQuery = this.normalizeForQuery(query);

    const cases = [
      {
        when: () => normQuery === 'playstation5pro' || normQuery === 'ps5pro' || normQuery === 'playstation5 pro' || normQuery === 'playstation 5 pro',
        result: () => {
          // Только точные совпадения с этими моделями
          const allowedModels = ['playstation5pro', 'ps5pro', 'playstation5 pro', 'playstation 5 pro'];
          const hasExact = models.some(m => allowedModels.includes(m));
          if (hasExact) {
            return { isValid: true, reason: 'model-match', confidence: 0.95 };
          }
          return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
        }
      },
      {
        when: () => normQuery.includes('5'),
        result: () => {
          // Если запрашивается PS5, то должны быть модели с "5"
          const hasPS5 = models.includes('5') || models.includes('playstation5') || models.includes('ps5');
          if (hasPS5) {
            return { isValid: true, reason: 'model-match', confidence: 0.95 };
          }
          // Если нет PS5, то это не PS5 модель
          return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
        }
      },
      {
        when: () => {
          // Проверяем частичные совпадения для общих случаев
          const queryParts = normQuery.split(/\s+/).filter(Boolean);
          return queryParts.some(part => 
            models.some(model => model.includes(part) || part.includes(model))
          );
        },
        result: { isValid: true, reason: 'model-match', confidence: 0.8 }
      }
    ];

    const result = cases.find(c => c.when())?.result;
    if (typeof result === 'function') {
      return result();
    }
    
    return result ?? { isValid: false, reason: 'no-model-match', confidence: 0.1 };
  }
} 