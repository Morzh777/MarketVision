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
    if (category === 'nintendo_switch') {
      return this.NINTENDO_SWITCH_RULES;
    }
    return null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    // ПРИОРИТЕТНАЯ проверка на прошитые/модифицированные консоли
    const isModified = this.isModifiedConsole(name);
    console.log('[NINTENDO SWITCH VALIDATOR DEBUG] Проверка прошитых консолей:', {
      name,
      isModified
    });
    
    if (isModified) {
      return { isValid: false, reason: 'accessory', confidence: 0.95 };
    }

    // Проверка на аксессуары (исключая подарочные наборы)
    if (rules.accessoryWords && this.isAccessory(name, rules.accessoryWords)) {
      return { isValid: false, reason: 'accessory', confidence: 0.95 };
    }

    // Дополнительная проверка на аксессуары по паттернам (исключая наборы)
    if (this.isAccessoryByPattern(name)) {
      return { isValid: false, reason: 'accessory', confidence: 0.9 };
    }

    // Извлечение моделей
    const models = this.extractModels(name, rules.modelPatterns || []);
    
    // DEBUG LOG
    console.log('[NINTENDO SWITCH VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return this.validateModelMatch(query, models);
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
    if (nintendoSwitchMatch) {
      models.push(this.normalizeForQuery('nintendoswitch'));
    }
    
    // Извлекаем "Switch"
    const switchMatch = name.match(/Switch/i);
    if (switchMatch) {
      models.push(this.normalizeForQuery('switch'));
    }
    
    // Извлекаем "OLED"
    const oledMatch = name.match(/OLED/i);
    if (oledMatch) {
      models.push(this.normalizeForQuery('oled'));
    }
    
    // Извлекаем номер модели (например, 2)
    const modelNumberMatch = name.match(/Switch\s*(\d+)/i);
    if (modelNumberMatch) {
      models.push(modelNumberMatch[1]);
    }
    
    // Извлекаем емкость (например, 64, 256)
    const capacityMatch = name.match(/(\d{2,3})\s*(?:GB|ГБ|TB|ТБ)/i);
    if (capacityMatch) {
      models.push(capacityMatch[1]);
    }
    
    // Извлекаем полные модели
    if (nintendoSwitchMatch && oledMatch) {
      models.push(this.normalizeForQuery('nintendoswitcholed'));
    }
    
    if (switchMatch && oledMatch) {
      models.push(this.normalizeForQuery('switcholed'));
    }
    
    // Специальная обработка для Switch 2
    if (name.match(/Switch\s*2/i)) {
      models.push('2');
      models.push(this.normalizeForQuery('switch2'));
    }
    
    return Array.from(new Set(models)).filter(Boolean);
  }

  /**
   * Переопределяем метод валидации для Nintendo Switch с улучшенной логикой
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    // Используем метод нормализации из базового класса
    const normQuery = this.normalizeForQuery(query);
    
    // Проверяем, есть ли точное совпадение
    if (models.includes(normQuery)) {
      return { isValid: true, reason: 'model-match', confidence: 0.95 };
    }
    
    // Специальная логика для Switch 2
    if (normQuery.includes('2')) {
      // Если запрашивается Switch 2, то должны быть модели с "2"
      const hasSwitch2 = models.includes('2') || models.includes('switch2');
      if (hasSwitch2) {
        return { isValid: true, reason: 'model-match', confidence: 0.95 };
      }
      // Если нет модели "2", то это не Switch 2
      return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
    }
    
    // Специальная логика для OLED
    if (normQuery.includes('oled')) {
      // Если запрашивается OLED, то должны быть OLED модели
      const hasOled = models.includes('oled') || models.includes('switcholed') || models.includes('nintendoswitcholed');
      if (hasOled) {
        return { isValid: true, reason: 'model-match', confidence: 0.95 };
      }
      // Если нет OLED, то это не OLED модель
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