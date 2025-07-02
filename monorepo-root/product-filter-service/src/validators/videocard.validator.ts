import { BaseValidator, ValidationResult } from './base.validator';

export class VideocardValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    // 1️⃣ ПРОСТАЯ ПРОВЕРКА: ищем запрос в названии товара
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует запросу' 
      };
    }
    
    // 2️⃣ УМНАЯ ПРОВЕРКА: проверяем модели
    if (this.modelMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует модели видеокарты' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует запросу' 
    };
  }

  extractModel(text: string): string | null {
    const normalizedText = this.normalizeText(text);
    
    // Паттерны для поиска ПОЛНЫХ моделей видеокарт
    const patterns = [
      /RTX\s*(\d{4})\s*(TI|SUPER|ULTRA)?/i,      // RTX 5070 Ti, RTX 5070 Super, RTX 5070
      /GTX\s*(\d{4})\s*(TI|SUPER|ULTRA)?/i,      // GTX 1660 Ti, GTX 1660 Super, GTX 1660
      /RX\s*(\d{4})\s*(XT|XTX|G)?/i,             // RX 7900 XT, RX 7900 XTX, RX 7900
      /(\d{4})\s*(TI|SUPER|ULTRA|XT|XTX|G)?/i,   // 5070 Ti, 5070 Super, 5070
      /(\d{4})(TI|SUPER|ULTRA|XT|XTX|G)/i        // 5070TI, 5070Super, 5070XT (БЕЗ пробела)
    ];
    
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const baseModel = match[1]; // 5070
        const suffix = match[2] || ''; // Ti, Super, XT, etc.
        
        // Формируем полную модель
        if (suffix) {
          return `${baseModel} ${suffix.toUpperCase()}`; // "5070 TI"
        } else {
          return baseModel; // "5070"
        }
      }
    }
    
    return null;
  }
} 