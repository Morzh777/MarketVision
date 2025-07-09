import { BaseValidator, ValidationResult } from './base.validator';
import { isAccessory } from '../utils/is-accessory';

export class PlaystationAccessoriesValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    // 0️⃣ ФИЛЬТРАЦИЯ АКСЕССУАРОВ (универсальная)
    if (!isAccessory(productName)) {
      return {
        isValid: false,
        reason: 'Не является аксессуаром'
      };
    }
    // 1️⃣ ПРОСТАЯ ПРОВЕРКА: ищем запрос в названии товара
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует запросу' 
      };
    }
    
    // 2️⃣ ПРОВЕРКА АКСЕССУАРОВ: проверяем что это именно аксессуар
    if (this.accessoryMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует аксессуару PlayStation' 
      };
    }
    
    // 3️⃣ ПРОВЕРКА КЛЮЧЕВЫХ СЛОВ: проверяем ключевые слова аксессуаров
    if (this.accessoryKeywordsMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует ключевым словам аксессуаров' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует запросу аксессуаров' 
    };
  }

  private accessoryMatch(query: string, productName: string): boolean {
    const normalizedQuery = this.normalizeText(query);
    const normalizedProduct = this.normalizeText(productName);
    
    // Извлекаем тип аксессуара из запроса
    const accessoryType = this.extractAccessoryType(normalizedQuery);
    
    if (!accessoryType) {
      return false;
    }
    
    // Проверяем, содержит ли товар этот тип аксессуара
    return normalizedProduct.includes(accessoryType);
  }

  private accessoryKeywordsMatch(query: string, productName: string): boolean {
    const normalizedQuery = this.normalizeText(query);
    const normalizedProduct = this.normalizeText(productName);
    
    // Ключевые слова аксессуаров PlayStation
    const accessoryKeywords = [
      'ДИСКОВОД', 'ЗАРЯДНАЯ СТАНЦИЯ', 'ГЕЙМПАД', 'ДЖОЙСТИК', 'КОНТРОЛЛЕР',
      'ЗАРЯДКА', 'ПОДСТАНДКА', 'ЧЕХОЛ', 'СУМКА', 'КЕЙС', 'СТЕНД',
      'ОХЛАЖДЕНИЕ', 'ВЕНТИЛЯТОР', 'ТЕПЛООТВОД', 'РАДИАТОР'
    ];
    
    // Ключевые слова PlayStation
    const playstationKeywords = [
      'PLAYSTATION', 'PS', 'SONY'
    ];
    
    // Проверяем, содержит ли запрос ключевые слова аксессуаров
    const hasAccessoryKeywords = accessoryKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
    
    // Проверяем, содержит ли товар ключевые слова аксессуаров
    const productHasAccessoryKeywords = accessoryKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    // Проверяем, содержит ли товар ключевые слова PlayStation
    const productHasPlaystationKeywords = playstationKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    // Если запрос содержит ключевые слова аксессуаров и товар тоже
    if (hasAccessoryKeywords && productHasAccessoryKeywords && productHasPlaystationKeywords) {
      return true;
    }
    
    return false;
  }

  extractModel(text: string): string | null {
    const normalizedText = this.normalizeText(text);
    
    // Для аксессуаров извлекаем тип аксессуара как модель
    const accessoryType = this.extractAccessoryType(normalizedText);
    if (accessoryType) {
      return accessoryType;
    }
    
    // Также проверяем версию PlayStation
    const playstationPatterns = [
      /PLAYSTATION\s*(\d+)/i,
      /PS\s*(\d+)/i
    ];
    
    for (const pattern of playstationPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        return `PS${match[1]}`;
      }
    }
    
    return null;
  }

  private extractAccessoryType(text: string): string | null {
    const accessoryTypes = [
      'ДИСКОВОД',
      'ЗАРЯДНАЯ СТАНЦИЯ', 
      'ГЕЙМПАД',
      'ДЖОЙСТИК',
      'КОНТРОЛЛЕР',
      'ЗАРЯДКА',
      'ПОДСТАНДКА',
      'ЧЕХОЛ',
      'СУМКА',
      'КЕЙС',
      'СТЕНД',
      'ОХЛАЖДЕНИЕ',
      'ВЕНТИЛЯТОР',
      'ТЕПЛООТВОД',
      'РАДИАТОР'
    ];
    
    for (const type of accessoryTypes) {
      if (text.includes(type)) {
        return type;
      }
    }
    
    return null;
  }

  // СТРОГАЯ ВАЛИДАЦИЯ: исключаем неправильные товары
  validateStrict(query: string, productName: string): ValidationResult {
    const normalizedQuery = this.normalizeText(query);
    const normalizedProduct = this.normalizeText(productName);
    
    // 1️⃣ ИСКЛЮЧАЕМ ОСНОВНЫЕ КОНСОЛИ
    const consoleKeywords = [
      'ИГРОВАЯ КОНСОЛЬ', 'ИГРОВАЯ ПРИСТАВКА'
    ];
    
    const isMainConsole = consoleKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    if (isMainConsole) {
      return { 
        isValid: false, 
        reason: 'Основная консоль, не аксессуар' 
      };
    }
    
    // 2️⃣ ПРОВЕРЯЕМ ЧТО ЭТО ИМЕННО АКСЕССУАР
    const accessoryKeywords = [
      'ДИСКОВОД', 'ЗАРЯДНАЯ СТАНЦИЯ', 'ГЕЙМПАД', 'ДЖОЙСТИК', 'КОНТРОЛЛЕР',
      'ЗАРЯДКА', 'ПОДСТАНДКА', 'ЧЕХОЛ', 'СУМКА', 'КЕЙС', 'СТЕНД',
      'ОХЛАЖДЕНИЕ', 'ВЕНТИЛЯТОР', 'ТЕПЛООТВОД', 'РАДИАТОР', 'АКСЕССУАР'
    ];
    
    const isAccessory = accessoryKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    if (!isAccessory) {
      return { 
        isValid: false, 
        reason: 'Не является аксессуаром' 
      };
    }
    
    // 3️⃣ ПРОВЕРЯЕМ СОВМЕСТИМОСТЬ С PLAYSTATION
    const playstationKeywords = [
      'PLAYSTATION', 'PS', 'SONY'
    ];
    
    const isPlaystationCompatible = playstationKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    if (!isPlaystationCompatible) {
      return { 
        isValid: false, 
        reason: 'Не совместим с PlayStation' 
      };
    }
    
    // 4️⃣ ПРОВЕРЯЕМ ВЕРСИЮ (5 vs 4)
    if (normalizedQuery.includes('5') && normalizedProduct.includes('4')) {
      return { 
        isValid: false, 
        reason: 'Аксессуар для PlayStation 4 вместо PlayStation 5' 
      };
    }
    
    if (normalizedQuery.includes('4') && normalizedProduct.includes('5')) {
      return { 
        isValid: false, 
        reason: 'Аксессуар для PlayStation 5 вместо PlayStation 4' 
      };
    }
    
    // 5️⃣ ПРОВЕРЯЕМ ТИП АКСЕССУАРА
    const queryAccessoryType = this.extractAccessoryType(normalizedQuery);
    const productAccessoryType = this.extractAccessoryType(normalizedProduct);
    
    if (queryAccessoryType && productAccessoryType && queryAccessoryType !== productAccessoryType) {
      return { 
        isValid: false, 
        reason: `Тип аксессуара не совпадает: ${queryAccessoryType} vs ${productAccessoryType}` 
      };
    }
    
    // 6️⃣ ФИНАЛЬНАЯ ПРОВЕРКА: точное соответствие
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Точное соответствие запросу' 
      };
    }
    
    // 7️⃣ ПРОВЕРКА АКСЕССУАРА
    if (this.accessoryMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует типу аксессуара' 
      };
    }
    
    // 8️⃣ ПРОВЕРКА КЛЮЧЕВЫХ СЛОВ
    if (this.accessoryKeywordsMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует ключевым словам аксессуаров' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует запросу аксессуаров' 
    };
  }
} 