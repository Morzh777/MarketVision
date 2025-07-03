// Простая реализация PlayStation валидатора для тестирования
class PlaystationValidator {
  normalizeText(text) {
    return text.toUpperCase().trim();
  }
  
  simpleMatch(query, productName) {
    const queryUpper = this.normalizeText(query);
    const productUpper = this.normalizeText(productName);
    return productUpper.includes(queryUpper);
  }
  
  extractModel(text) {
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
  
  modelMatch(query, productName) {
    const queryModel = this.extractModel(query);
    if (!queryModel) return false;
    
    const productModel = this.extractModel(productName);
    if (!productModel) return false;
    
    return queryModel === productModel;
  }
  
  playstationKeywordsMatch(query, productName) {
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
  
  validate(query, productName) {
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

  // НОВАЯ МЕТОДИКА: Строгая валидация для исключения неправильных товаров
  validateStrict(query, productName) {
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

// Создаем экземпляр валидатора
const validator = new PlaystationValidator();

// Тестовые данные на основе реальных товаров из JSON
const testCases = [
  // ✅ ДОЛЖНЫ ПРОЙТИ (правильные PlayStation 5 Pro)
  {
    query: "PlayStation 5 Pro",
    productName: "Sony Игровая приставка Sony PlayStation 5 Pro 2 ТБ, цифровая консоль",
    expected: true,
    description: "PlayStation 5 Pro - точное совпадение"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Игровая консоль Sony PlayStation 5 Pro Digital Edition 2TB (CFI-7021)",
    expected: true,
    description: "PlayStation 5 Pro Digital Edition"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Игровая консоль PS5 Pro 2 TB",
    expected: true,
    description: "PS5 Pro 2TB"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "PlayStation 5 Pro 2 ТБ",
    expected: true,
    description: "PlayStation 5 Pro 2TB"
  },
  
  // ❌ ДОЛЖНЫ ОТКЛОНИТЬСЯ (неправильные товары)
  {
    query: "PlayStation 5 Pro",
    productName: "Игровая приставка Sony Playstation Portal PS5 White/Белый",
    expected: false,
    description: "PlayStation Portal - не консоль"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Игровая консоль Sony PlayStation 4 PRO 1ТБ (7108)",
    expected: false,
    description: "PlayStation 4 Pro - не 5 модель"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Игровая консоль PlayStation 5 Slim Digital CFI-2000B01",
    expected: false,
    description: "PlayStation 5 Slim - не Pro"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Замена лицевой панели боковой пластины корпуса для PS5 Pro",
    expected: false,
    description: "Запчасть - не консоль"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Зарядная станция, подставка для 5 slim",
    expected: false,
    description: "Аксессуар - зарядная станция"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "PS5 Pro Slim Станция заряда с охлаждением",
    expected: false,
    description: "Аксессуар - станция заряда"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Дисковод Sony для Playstation 5 Pro Slim белый",
    expected: false,
    description: "Аксессуар - дисковод"
  },
  {
    query: "PlayStation 5 Pro",
    productName: "Игровая приставка Portal для стриминга c PS5",
    expected: false,
    description: "Portal - не консоль"
  }
];

console.log("🧪 Тестирование PlayStation валидатора (СТРОГАЯ ЛОГИКА)\n");

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`📋 Тест ${index + 1}: ${testCase.description}`);
  console.log(`   Запрос: "${testCase.query}"`);
  console.log(`   Товар: "${testCase.productName}"`);
  
  const result = validator.validateStrict(testCase.query, testCase.productName);
  
  console.log(`   Результат: ${result.isValid ? '✅ ВАЛИДЕН' : '❌ НЕ ВАЛИДЕН'}`);
  console.log(`   Причина: ${result.reason}`);
  
  if (result.isValid === testCase.expected) {
    console.log(`   Статус: ✅ ПРОЙДЕН\n`);
    passedTests++;
  } else {
    console.log(`   Статус: ❌ ПРОВАЛЕН (ожидалось: ${testCase.expected})\n`);
  }
});

console.log(`📊 Результаты: ${passedTests}/${totalTests} тестов пройдено`);

if (passedTests === totalTests) {
  console.log("🎉 Все тесты пройдены успешно!");
} else {
  console.log("⚠️ Некоторые тесты провалены");
}

// Дополнительные тесты для extractModel
console.log("\n🔍 Тестирование извлечения моделей:\n");

const modelTestCases = [
  "PlayStation 5 Pro",
  "PS5 Digital",
  "PlayStation Portal",
  "CFI-7000B1",
  "PlayStation 5 Slim"
];

modelTestCases.forEach(text => {
  const model = validator.extractModel(text);
  console.log(`"${text}" -> "${model}"`);
}); 