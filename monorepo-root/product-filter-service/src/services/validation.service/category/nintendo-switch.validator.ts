import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class NintendoSwitchValidator extends ProductValidatorBase {
  private readonly NINTENDO_SWITCH_RULES: ValidationRules = {
    modelPatterns: [
      /Nintendo\s+Switch\s+(?:OLED\s+)?(\d*)/i,
      /Switch\s+(?:OLED\s+)?(\d*)/i
    ],
    accessoryWords: [
      'контроллер', 'джойстик', 'кабель', 'шнур', 'зарядка', 'подставка', 'чехол',
      'картридж', 'карта памяти', 'наушники', 'гарнитура', 'микрофон',
      'панель', 'накладки', 'стики', 'лапки', 'защитный', 'силиконовый', 'кожаный',
      'пластиковый', 'металлический', 'аксессуар', 'адаптер',
      'переходник', 'кнопки', 'кнопка', 'стик', 'стики', 'джойстики'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    const cases = [
      {
        when: () => category === 'nintendo_switch',
        result: this.NINTENDO_SWITCH_RULES
      }
    ];

    return cases.find(c => c.when())?.result ?? null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    const models = this.extractModels(name, rules.modelPatterns || []);

    const cases = [
      {
        when: () => this.isModifiedConsole(name),
        result: { isValid: false, reason: 'accessory', confidence: 0.95 }
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
        when: () => this.validateModelMatch(query, models).isValid,
        result: { isValid: true, reason: 'model-match', confidence: 0.95 }
      }
    ];

    // DEBUG LOG
    console.log('[NINTENDO SWITCH VALIDATOR DEBUG]', {
      query,
      name,
      models,
      isModified: this.isModifiedConsole(name)
    });

    return cases.find(c => c.when())?.result ?? { 
      isValid: false, 
      reason: 'no-model-match', 
      confidence: 0.1 
    };
  }

  /**
   * Улучшенная проверка на аксессуары по паттернам с исключением наборов
   */
  private isAccessoryByPattern(name: string): boolean {
    // Сначала проверяем, не является ли это подарочным набором
    if (this.isGiftSet(name)) {
      return false;
    }

    const accessoryPatterns = [
      // Паттерны для чехлов и защитных аксессуаров
      /\b(?:чехол|сумка|накладки?|защитный|силиконовый|кожаный|пластиковый|металлический|панель)\b/i,
      
      // Паттерны для аксессуаров с предлогами
      /\b(?:для|на|под)\s+(?:nintendo\s*switch|switch|oled)\b/i,
      
      // Паттерны для стиков и кнопок
      /\b(?:стики?|лапки?|кнопки?|джойстики?)\b/i,
      
      // Паттерны для кабелей и адаптеров
      /\b(?:кабель|шнур|адаптер|переходник|зарядка)\b/i,
      
      // Паттерны для картриджей и карт памяти (но не игр в наборах)
      /\b(?:картридж|карта памяти|наушники|гарнитура|микрофон)\b/i,
      
      // Паттерны для комплектов и наборов (только если это не подарочный набор)
      /\b(?:комплект|набор|аксессуар|дополнительно)\b/i
    ];

    return accessoryPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Проверка, является ли товар подарочным набором
   */
  private isGiftSet(name: string): boolean {
    const giftSetPatterns = [
      // Паттерны для подарочных наборов с играми
      /\b(?:игра|игры)\s+(?:в\s+)?(?:комплекте|наборе|bundle)\b/i,
      /\b(?:включая|включает|с\s+игрой)\s+(?:mario|mario\s+kart|игрой)\b/i,
      /\b(?:bundle|комплект|набор)\s+(?:с\s+)?(?:mario|игрой)\b/i,
      /\b(?:mario\s+kart|mario)\s+(?:world|bundle|комплект)\b/i,
      /\b(?:игровой\s+набор|подарочный\s+набор)\b/i
    ];

    return giftSetPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Проверка на прошитые/модифицированные консоли
   */
  private isModifiedConsole(name: string): boolean {
    const modifiedPatterns = [
      // Паттерны для прошитых консолей
      /\b(?:прошитая|прошитый|прошит)\b/i,
      /(?:ревизия|рев)/i,
      /\b(?:hwfly|modchip|модчип)\b/i,
      /\b(?:модифицированная|модифицированный)\b/i,
      /\b(?:чип|чипованная|чипованный)\b/i,
      /\b(?:jailbreak|джейлбрейк)\b/i,
      /\b(?:homebrew|хомбрю)\b/i,
      /\b(?:кастомная|кастомный)\b/i,
      /\b(?:взломанная|взломанный)\b/i
    ];

    const matchedPatterns = modifiedPatterns.filter(pattern => pattern.test(name));
    
    if (matchedPatterns.length > 0) {
      console.log('[NINTENDO SWITCH VALIDATOR DEBUG] Найдены прошитые паттерны:', {
        name,
        matchedPatterns: matchedPatterns.map(p => p.source)
      });
    }

    return matchedPatterns.length > 0;
  }

  /**
   * Переопределяем извлечение моделей для лучшей обработки Nintendo Switch
   */
  protected extractModels(name: string, patterns: RegExp[]): string[] {
    const models: string[] = [];
    
    // Извлекаем "Nintendo Switch"
    const nintendoSwitchMatch = name.match(/Nintendo\s*Switch/i);
    const nintendoSwitchCases = [
      {
        when: () => nintendoSwitchMatch !== null,
        result: () => models.push(this.normalizeForQuery('nintendoswitch'))
      }
    ];
    nintendoSwitchCases.find(c => c.when())?.result();
    
    // Извлекаем "Switch"
    const switchMatch = name.match(/Switch/i);
    const switchCases = [
      {
        when: () => switchMatch !== null,
        result: () => models.push(this.normalizeForQuery('switch'))
      }
    ];
    switchCases.find(c => c.when())?.result();
    
    // Извлекаем "OLED"
    const oledMatch = name.match(/OLED/i);
    const oledCases = [
      {
        when: () => oledMatch !== null,
        result: () => models.push(this.normalizeForQuery('oled'))
      }
    ];
    oledCases.find(c => c.when())?.result();
    
    // Извлекаем номер модели (например, 2)
    const modelNumberMatch = name.match(/Switch\s*(\d+)/i);
    const modelNumberCases = [
      {
        when: () => modelNumberMatch !== null,
        result: () => models.push(modelNumberMatch[1])
      }
    ];
    modelNumberCases.find(c => c.when())?.result();
    
    // Извлекаем емкость (например, 64, 256)
    const capacityMatch = name.match(/(\d{2,3})\s*(?:GB|ГБ|TB|ТБ)/i);
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
        when: () => nintendoSwitchMatch !== null && oledMatch !== null,
        result: () => models.push(this.normalizeForQuery('nintendoswitcholed'))
      },
      {
        when: () => switchMatch !== null && oledMatch !== null,
        result: () => models.push(this.normalizeForQuery('switcholed'))
      }
    ];
    fullModelCases.find(c => c.when())?.result();
    
    // Специальная обработка для Switch 2
    const switch2Cases = [
      {
        when: () => name.match(/Switch\s*2/i) !== null,
        result: () => {
          models.push('2');
          models.push(this.normalizeForQuery('switch2'));
        }
      }
    ];
    switch2Cases.find(c => c.when())?.result();
    
    return Array.from(new Set(models)).filter(Boolean);
  }

  /**
   * Переопределяем метод валидации для Nintendo Switch с улучшенной логикой
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    // Используем метод нормализации из базового класса
    const normQuery = this.normalizeForQuery(query);
    
    const cases = [
      {
        when: () => models.includes(normQuery),
        result: { isValid: true, reason: 'model-match', confidence: 0.95 }
      },
      {
        when: () => normQuery.includes('2'),
        result: () => {
          // Если запрашивается Switch 2, то должны быть модели с "2"
          const hasSwitch2 = models.includes('2') || models.includes('switch2');
          if (hasSwitch2) {
            return { isValid: true, reason: 'model-match', confidence: 0.95 };
          }
          // Если нет модели "2", то это не Switch 2
          return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
        }
      },
      {
        when: () => normQuery.includes('oled'),
        result: () => {
          // Если запрашивается OLED, то должны быть OLED модели
          const hasOled = models.includes('oled') || models.includes('switcholed') || models.includes('nintendoswitcholed');
          if (hasOled) {
            return { isValid: true, reason: 'model-match', confidence: 0.95 };
          }
          // Если нет OLED, то это не OLED модель
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