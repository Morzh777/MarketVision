import { BaseValidator, ValidationResult } from './base.validator';
import { isAccessory } from '../utils/is-accessory';

export class PlaystationValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    // 0️⃣ ФИЛЬТРАЦИЯ АКСЕССУАРОВ
    if (isAccessory(productName)) {
      return {
        isValid: false,
        reason: 'аксессуар'
      };
    }
    // 1️⃣ ПРОСТАЯ ПРОВЕРКА: ищем запрос в названии товара
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует запросу' 
      };
    }
    
    // 2️⃣ УМНАЯ ПРОВЕРКА: проверяем модели PlayStation
    if (this.modelMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует модели PlayStation' 
      };
    }
    
    // 3️⃣ ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: проверяем ключевые слова PlayStation
    if (this.playstationKeywordsMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует ключевым словам PlayStation' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует запросу' 
    };
  }

  extractModel(text: string): string | null {
    const normalizedText = this.normalizeText(text);
    
    // Паттерны для поиска моделей PlayStation
    const patterns = [
      /PLAYSTATION\s*(\d+)\s*(PRO|SLIM|DIGITAL|STANDARD)?/i,  // PlayStation 5 Pro, PlayStation 5 Digital
      /PS\s*(\d+)\s*(PRO|SLIM|DIGITAL|STANDARD)?/i,           // PS5 Pro, PS5 Digital
      /PLAYSTATION\s*PORTAL/i,                                 // PlayStation Portal
      /PS\s*PORTAL/i,                                          // PS Portal
      /CFI[-\s]*(\d+[A-Z]?)/i,                                 // CFI-7000B1, CFI-7021B
      /(\d+)[-\s]*(PRO|SLIM|DIGITAL|STANDARD)/i               // 5 Pro, 5 Digital
    ];
    
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        if (pattern.source.includes('PORTAL')) {
          return 'PORTAL';
        }
        
        const baseModel = match[1]; // 5, 7000B1, etc.
        const suffix = match[2] || ''; // Pro, Digital, etc.
        
        // Формируем полную модель
        if (suffix) {
          return `${baseModel} ${suffix.toUpperCase()}`; // "5 PRO", "5 DIGITAL"
        } else {
          return baseModel; // "5", "7000B1"
        }
      }
    }
    
    return null;
  }

  private playstationKeywordsMatch(query: string, productName: string): boolean {
    const normalizedQuery = this.normalizeText(query);
    const normalizedProduct = this.normalizeText(productName);
    
    // Ключевые слова PlayStation
    const playstationKeywords = [
      'PLAYSTATION', 'PS', 'SONY', 'ИГРОВАЯ КОНСОЛЬ', 'ИГРОВАЯ ПРИСТАВКА'
    ];
    
    // Проверяем, содержит ли запрос ключевые слова PlayStation
    const hasPlaystationKeywords = playstationKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
    
    // Проверяем, содержит ли товар ключевые слова PlayStation
    const productHasPlaystationKeywords = playstationKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    // Если запрос содержит PlayStation ключевые слова и товар тоже
    if (hasPlaystationKeywords && productHasPlaystationKeywords) {
      // Дополнительная проверка на номер модели
      const queryModel = this.extractModel(query);
      const productModel = this.extractModel(productName);
      
      if (queryModel && productModel) {
        return queryModel === productModel;
      }
      
      // Если модели не найдены, но есть общие ключевые слова
      return true;
    }
    
    return false;
  }

  // НОВАЯ МЕТОДИКА: Строгая валидация для исключения неправильных товаров
  validateStrict(query: string, productName: string): ValidationResult {
    const normalizedQuery = this.normalizeText(query);
    const normalizedProduct = this.normalizeText(productName);
    
    // 1️⃣ ИСКЛЮЧАЕМ АКСЕССУАРЫ И ЗАПЧАСТИ
    const accessoryKeywords = [
      'ЗАМЕНА', 'ПАНЕЛЬ', 'ПЛАСТИНА', 'КОРПУС', 'ЗАРЯДНАЯ СТАНЦИЯ', 
      'ПОДСТАНДКА', 'ОХЛАЖДЕНИЕ', 'ДИСКОВОД', 'ГЕЙМПАД', 'ДЖОЙСТИК',
      'ЗАРЯДКА', 'ПОРТАЛ', 'СТРИМИНГ', 'АКСЕССУАР', 'КОМПЛЕКТ'
    ];
    
    const isAccessory = accessoryKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    if (isAccessory) {
      return { 
        isValid: false, 
        reason: 'Аксессуар или запчасть, не основная консоль' 
      };
    }
    
    // 2️⃣ ПРОВЕРЯЕМ ЧТО ЭТО ИМЕННО КОНСОЛЬ
    const consoleKeywords = [
      'ИГРОВАЯ КОНСОЛЬ', 'ИГРОВАЯ ПРИСТАВКА', 'PLAYSTATION', 'PS'
    ];
    
    const isConsole = consoleKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    if (!isConsole) {
      return { 
        isValid: false, 
        reason: 'Не является игровой консолью' 
      };
    }
    
    // 3️⃣ ПРОВЕРЯЕМ ВЕРСИЮ (5 vs 4)
    if (normalizedQuery.includes('5') && normalizedProduct.includes('4')) {
      return { 
        isValid: false, 
        reason: 'PlayStation 4 вместо PlayStation 5' 
      };
    }
    
    if (normalizedQuery.includes('4') && normalizedProduct.includes('5')) {
      return { 
        isValid: false, 
        reason: 'PlayStation 5 вместо PlayStation 4' 
      };
    }
    
    // 4️⃣ ПРОВЕРЯЕМ МОДЕЛЬ (Pro vs Slim vs Standard)
    if (normalizedQuery.includes('PRO') && normalizedProduct.includes('SLIM')) {
      return { 
        isValid: false, 
        reason: 'PlayStation 5 Slim вместо PlayStation 5 Pro' 
      };
    }
    
    if (normalizedQuery.includes('SLIM') && normalizedProduct.includes('PRO')) {
      return { 
        isValid: false, 
        reason: 'PlayStation 5 Pro вместо PlayStation 5 Slim' 
      };
    }
    
    // 5️⃣ ПРОВЕРЯЕМ PORTAL
    if (normalizedQuery.includes('PORTAL') && !normalizedProduct.includes('PORTAL')) {
      return { 
        isValid: false, 
        reason: 'Не PlayStation Portal' 
      };
    }
    
    if (!normalizedQuery.includes('PORTAL') && normalizedProduct.includes('PORTAL')) {
      return { 
        isValid: false, 
        reason: 'PlayStation Portal вместо консоли' 
      };
    }
    
    // 6️⃣ ФИНАЛЬНАЯ ПРОВЕРКА: точное соответствие
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Точное соответствие запросу' 
      };
    }
    
    // 7️⃣ ПРОВЕРКА МОДЕЛИ
    if (this.modelMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует модели' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует критериям поиска' 
    };
  }
} 