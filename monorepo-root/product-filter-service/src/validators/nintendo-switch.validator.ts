import { BaseValidator, ValidationResult } from './base.validator';

export class NintendoSwitchValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    // 1️⃣ ПРОСТАЯ ПРОВЕРКА: ищем запрос в названии товара
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует запросу' 
      };
    }
    
    // 2️⃣ ПРОВЕРКА МОДЕЛИ: проверяем модели Nintendo Switch
    if (this.modelMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует модели Nintendo Switch' 
      };
    }
    
    // 3️⃣ ПРОВЕРКА КЛЮЧЕВЫХ СЛОВ: проверяем ключевые слова Nintendo
    if (this.nintendoKeywordsMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует ключевым словам Nintendo' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует запросу' 
    };
  }

  extractModel(text: string): string | null {
    const normalizedText = this.normalizeText(text);
    
    // Паттерны для поиска моделей Nintendo Switch
    const patterns = [
      /NINTENDO\s*SWITCH\s*(2|OLED|LITE)?/i,  // Nintendo Switch 2, Nintendo Switch OLED
      /SWITCH\s*(2|OLED|LITE)?/i,             // Switch 2, Switch OLED
      /NS\s*(2|OLED|LITE)?/i,                 // NS 2, NS OLED
      /(\d+)[-\s]*(OLED|LITE)/i               // 2 OLED, 2 LITE
    ];
    
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const baseModel = match[1] || ''; // 2, OLED, LITE, etc.
        const suffix = match[2] || ''; // OLED, LITE, V2, etc.
        
        // Формируем полную модель
        if (suffix) {
          return `${baseModel} ${suffix.toUpperCase()}`; // "2 OLED", "OLED"
        } else if (baseModel) {
          return baseModel.toUpperCase(); // "2", "OLED"
        } else {
          return 'SWITCH'; // Базовая модель
        }
      }
    }
    
    return null;
  }

  private nintendoKeywordsMatch(query: string, productName: string): boolean {
    const normalizedQuery = this.normalizeText(query);
    const normalizedProduct = this.normalizeText(productName);
    
    // Ключевые слова Nintendo
    const nintendoKeywords = [
      'NINTENDO', 'SWITCH', 'NS', 'ИГРОВАЯ КОНСОЛЬ', 'ИГРОВАЯ ПРИСТАВКА'
    ];
    
    // Проверяем, содержит ли запрос ключевые слова Nintendo
    const hasNintendoKeywords = nintendoKeywords.some(keyword => 
      normalizedQuery.includes(keyword)
    );
    
    // Проверяем, содержит ли товар ключевые слова Nintendo
    const productHasNintendoKeywords = nintendoKeywords.some(keyword => 
      normalizedProduct.includes(keyword)
    );
    
    // Если запрос содержит Nintendo ключевые слова и товар тоже
    if (hasNintendoKeywords && productHasNintendoKeywords) {
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

  // СТРОГАЯ ВАЛИДАЦИЯ: исключаем неправильные товары
  validateStrict(query: string, productName: string): ValidationResult {
    const normalizedQuery = this.normalizeText(query);
    const normalizedProduct = this.normalizeText(productName);
    
    // 1️⃣ ИСКЛЮЧАЕМ АКСЕССУАРЫ И ЗАПЧАСТИ
    const accessoryKeywords = [
      'ЗАМЕНА', 'ПАНЕЛЬ', 'ПЛАСТИНА', 'КОРПУС', 'ЗАРЯДНАЯ СТАНЦИЯ', 
      'ПОДСТАНДКА', 'ОХЛАЖДЕНИЕ', 'ДИСКОВОД', 'ГЕЙМПАД', 'ДЖОЙСТИК',
      'ЗАРЯДКА', 'СТРИМИНГ', 'АКСЕССУАР', 'КОМПЛЕКТ', 'ЧЕХОЛ', 'СУМКА'
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
      'ИГРОВАЯ КОНСОЛЬ', 'ИГРОВАЯ ПРИСТАВКА', 'NINTENDO', 'SWITCH'
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
    
    // 3️⃣ ИСКЛЮЧАЕМ СКАМЕРСКИЕ ОБОЗНАЧЕНИЯ V1/V2
    if (normalizedProduct.includes('V1') || normalizedProduct.includes('V2')) {
      return { 
        isValid: false, 
        reason: 'Скамерское обозначение V1/V2 - не настоящая модель' 
      };
    }
    
    // 4️⃣ ПРОВЕРЯЕМ ВЕРСИЮ (2 vs 1)
    if (normalizedQuery.includes('2') && normalizedProduct.includes('1') && !normalizedProduct.includes('2')) {
      return { 
        isValid: false, 
        reason: 'Nintendo Switch 1 вместо Nintendo Switch 2' 
      };
    }
    
    if (normalizedQuery.includes('1') && normalizedProduct.includes('2')) {
      return { 
        isValid: false, 
        reason: 'Nintendo Switch 2 вместо Nintendo Switch 1' 
      };
    }
    
    // 5️⃣ ПРОВЕРЯЕМ МОДЕЛЬ (OLED vs Lite vs Standard)
    if (normalizedQuery.includes('OLED') && normalizedProduct.includes('LITE')) {
      return { 
        isValid: false, 
        reason: 'Nintendo Switch Lite вместо Nintendo Switch OLED' 
      };
    }
    
    if (normalizedQuery.includes('LITE') && normalizedProduct.includes('OLED')) {
      return { 
        isValid: false, 
        reason: 'Nintendo Switch OLED вместо Nintendo Switch Lite' 
      };
    }
    
    // 6️⃣ ИСКЛЮЧАЕМ ДРУГИЕ КОНСОЛИ
    const otherConsoles = [
      'PLAYSTATION', 'PS', 'XBOX', 'SEGA', 'ATARI'
    ];
    
    const isOtherConsole = otherConsoles.some(console => 
      normalizedProduct.includes(console)
    );
    
    if (isOtherConsole) {
      return { 
        isValid: false, 
        reason: 'Другая игровая консоль, не Nintendo Switch' 
      };
    }
    
    // 7️⃣ ФИНАЛЬНАЯ ПРОВЕРКА: точное соответствие
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Точное соответствие запросу' 
      };
    }
    
    // 8️⃣ ПРОВЕРКА МОДЕЛИ
    if (this.modelMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует модели' 
      };
    }
    
    // 9️⃣ ПРОВЕРКА КЛЮЧЕВЫХ СЛОВ
    if (this.nintendoKeywordsMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует ключевым словам Nintendo' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует критериям поиска' 
    };
  }
} 