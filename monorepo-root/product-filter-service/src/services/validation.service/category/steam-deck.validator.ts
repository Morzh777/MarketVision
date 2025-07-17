import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class SteamDeckValidator extends ProductValidatorBase {
  private readonly STEAM_DECK_RULES: ValidationRules = {
    modelPatterns: [
      /Steam\s+Deck\s+(?:OLED\s+)?(\d*)/i,
      /Deck\s+(?:OLED\s+)?(\d*)/i
    ],
    accessoryWords: [
      'чехол', 'сумка', 'кабель', 'шнур', 'зарядка', 'подставка', 'держатель',
      'игра', 'карта памяти', 'наушники', 'гарнитура', 'микрофон', 'экран',
      'накладки', 'стики', 'лапки', 'защитный', 'силиконовый', 'кожаный',
      'пластиковый', 'металлический', 'аксессуар', 'комплект', 'набор',
      'док-станция', 'докстанция', 'док', 'станция', 'адаптер', 'переходник',
      'кнопки', 'кнопка', 'стик', 'стики', 'джойстик', 'джойстики'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    const cases = [
      {
        when: () => category === 'steam_deck',
        result: this.STEAM_DECK_RULES
      }
    ];

    return cases.find(c => c.when())?.result ?? null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    const models = this.extractModels(name, rules.modelPatterns || []);

    const cases = [
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
    console.log('[STEAM DECK VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return cases.find(c => c.when())?.result ?? { 
      isValid: false, 
      reason: 'no-model-match', 
      confidence: 0.1 
    };
  }

  /**
   * Улучшенная проверка на аксессуары по паттернам
   */
  private isAccessoryByPattern(name: string): boolean {
    const accessoryPatterns = [
      // Паттерны для чехлов и защитных аксессуаров
      /\b(?:чехол|сумка|накладки?|защитный|силиконовый|кожаный|пластиковый|металлический)\b/i,
      
      // Паттерны для аксессуаров с предлогами
      /\b(?:для|на|под)\s+(?:steam\s*deck|deck|oled)\b/i,
      
      // Паттерны для стиков и кнопок
      /\b(?:стики?|лапки?|кнопки?|джойстики?)\b/i,
      
      // Паттерны для док-станций
      /\b(?:док-станция|докстанция|док|станция)\b/i,
      
      // Паттерны для кабелей и адаптеров
      /\b(?:кабель|шнур|адаптер|переходник|зарядка)\b/i,
      
      // Паттерны для игр и программного обеспечения
      /\b(?:игра|игры|карта памяти|наушники|гарнитура|микрофон)\b/i,
      
      // Паттерны для комплектов и наборов
      /\b(?:комплект|набор|аксессуар|дополнительно)\b/i
    ];

    return accessoryPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Переопределяем извлечение моделей для лучшей обработки Steam Deck
   */
  protected extractModels(name: string, patterns: RegExp[]): string[] {
    const models: string[] = [];
    
    // Извлекаем "Steam Deck" или "Deck"
    const steamDeckMatch = name.match(/Steam\s*Deck/i);
    const steamDeckCases = [
      {
        when: () => steamDeckMatch !== null,
        result: () => models.push(this.normalizeForQuery('steamdeck'))
      }
    ];
    steamDeckCases.find(c => c.when())?.result();
    
    const deckMatch = name.match(/Deck/i);
    const deckCases = [
      {
        when: () => deckMatch !== null,
        result: () => models.push(this.normalizeForQuery('deck'))
      }
    ];
    deckCases.find(c => c.when())?.result();
    
    // Извлекаем "OLED"
    const oledMatch = name.match(/OLED/i);
    const oledCases = [
      {
        when: () => oledMatch !== null,
        result: () => models.push(this.normalizeForQuery('oled'))
      }
    ];
    oledCases.find(c => c.when())?.result();
    
    // Извлекаем емкость (например, 512, 1TB, 1ТБ)
    const capacityMatch = name.match(/(\d{3,4})\s*(?:GB|ГБ|TB|ТБ)/i);
    const capacityCases = [
      {
        when: () => capacityMatch !== null,
        result: () => models.push(capacityMatch[1])
      }
    ];
    capacityCases.find(c => c.when())?.result();
    
    // Извлекаем полную модель (например, steamdeckoled)
    const fullModelCases = [
      {
        when: () => steamDeckMatch !== null && oledMatch !== null,
        result: () => models.push(this.normalizeForQuery('steamdeckoled'))
      }
    ];
    fullModelCases.find(c => c.when())?.result();
    
    return Array.from(new Set(models)).filter(Boolean);
  }

  /**
   * Переопределяем метод валидации для Steam Deck с улучшенной логикой
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
        when: () => {
          // Проверяем частичные совпадения для Steam Deck
          const queryParts = normQuery.split(/\s+/).filter(Boolean);
          return queryParts.some(part => 
            models.some(model => model.includes(part) || part.includes(model))
          );
        },
        result: { isValid: true, reason: 'model-match', confidence: 0.8 }
      }
    ];

    return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'no-model-match', confidence: 0.1 };
  }
} 