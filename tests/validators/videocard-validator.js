class BaseValidator {
  normalizeText(text) {
    return text.toUpperCase().trim();
  }
  
  simpleMatch(query, productName) {
    const queryUpper = this.normalizeText(query);
    const productUpper = this.normalizeText(productName);
    return productUpper.includes(queryUpper);
  }
  
  modelMatch(query, productName) {
    const queryModel = this.extractModel(query);
    if (!queryModel) return false;
    
    const productModel = this.extractModel(productName);
    if (!productModel) return false;
    
    return queryModel === productModel;
  }
}

class VideocardValidator extends BaseValidator {
  validate(query, productName) {
    console.log(`🔍 Валидация: "${query}" vs "${productName}"`);
    
    // 1️⃣ ПРОСТАЯ ПРОВЕРКА: ищем запрос в названии товара
    if (this.simpleMatch(query, productName)) {
      console.log(`✅ Простая проверка: "${query}" соответствует "${productName}"`);
      return { 
        isValid: true, 
        reason: 'Соответствует запросу' 
      };
    }
    
    // 2️⃣ УМНАЯ ПРОВЕРКА: проверяем модели
    if (this.modelMatch(query, productName)) {
      console.log(`✅ Умная проверка: "${query}" соответствует модели "${productName}"`);
      return { 
        isValid: true, 
        reason: 'Соответствует модели видеокарты' 
      };
    }
    
    console.log(`❌ НЕ соответствует: "${query}" vs "${productName}"`);
    return { 
      isValid: false, 
      reason: 'Не соответствует запросу' 
    };
  }

  extractModel(text) {
    const normalizedText = this.normalizeText(text);
    console.log(`🔧 Извлечение модели из: "${text}" -> "${normalizedText}"`);
    
    // Паттерны для поиска ПОЛНЫХ моделей видеокарт
    const patterns = [
      /RTX\s*(\d{4})\s*(TI|SUPER|ULTRA)?/i,      // RTX 5070 Ti, RTX 5070 Super, RTX 5070
      /GTX\s*(\d{4})\s*(TI|SUPER|ULTRA)?/i,      // GTX 1660 Ti, GTX 1660 Super, GTX 1660
      /RX\s*(\d{4})\s*(XT|XTX|G)?/i,             // RX 7900 XT, RX 7900 XTX, RX 7900
      /(\d{4})\s*(TI|SUPER|ULTRA|XT|XTX|G)?/i,   // 5070 Ti, 5070 Super, 5070
      /(\d{4})(TI|SUPER|ULTRA|XT|XTX|G)/i        // 5070TI, 5070Super, 5070XT (БЕЗ пробела)
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = normalizedText.match(pattern);
      if (match) {
        const baseModel = match[1]; // 5070
        const suffix = match[2] || ''; // Ti, Super, XT, etc.
        
        // Формируем полную модель
        let result;
        if (suffix) {
          result = `${baseModel} ${suffix.toUpperCase()}`; // "5070 TI"
        } else {
          result = baseModel; // "5070"
        }
        
        console.log(`✅ Извлечена модель: "${result}" (паттерн ${i + 1})`);
        return result;
      }
    }
    
    console.log(`❌ Модель не найдена в: "${text}"`);
    return null;
  }
}

module.exports = { VideocardValidator, BaseValidator }; 