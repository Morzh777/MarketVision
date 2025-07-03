// Простая реализация PlayStation Accessories валидатора для тестирования
class PlaystationAccessoriesValidator {
  normalizeText(text) {
    return text.toUpperCase().trim();
  }
  
  simpleMatch(query, productName) {
    const queryUpper = this.normalizeText(query);
    const productUpper = this.normalizeText(productName);
    return productUpper.includes(queryUpper);
  }
  
  extractAccessoryType(text) {
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
  
  extractModel(text) {
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
  
  accessoryMatch(query, productName) {
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
  
  accessoryKeywordsMatch(query, productName) {
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
  
  validate(query, productName) {
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

  // СТРОГАЯ ВАЛИДАЦИЯ: исключаем неправильные товары
  validateStrict(query, productName) {
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

// Создаем экземпляр валидатора
const validator = new PlaystationAccessoriesValidator();

// Тестовые данные для аксессуаров PlayStation
const testCases = [
  // ✅ ДОЛЖНЫ ПРОЙТИ (правильные аксессуары)
  {
    query: "Дисковод Sony для Playstation 5 Pro",
    productName: "Дисковод Sony для Playstation 5 Pro Slim белый",
    expected: true,
    description: "Дисковод для PS5 Pro - точное совпадение"
  },
  {
    query: "Дисковод Sony для Playstation 5 Pro",
    productName: "Sony Дисковод для PlayStation 5 Pro",
    expected: true,
    description: "Дисковод Sony для PS5 Pro"
  },
  {
    query: "Зарядная станция PS5",
    productName: "Зарядная станция для PlayStation 5",
    expected: true,
    description: "Зарядная станция для PS5"
  },
  {
    query: "Геймпад PlayStation 5",
    productName: "Sony DualSense геймпад для PS5",
    expected: true,
    description: "Геймпад DualSense для PS5"
  },
  {
    query: "Джойстик PS5",
    productName: "Джойстик для PlayStation 5",
    expected: true,
    description: "Джойстик для PS5"
  },
  
  // ❌ ДОЛЖНЫ ОТКЛОНИТЬСЯ (неправильные товары)
  {
    query: "Дисковод Sony для Playstation 5 Pro",
    productName: "Игровая консоль Sony PlayStation 5 Pro 2 ТБ",
    expected: false,
    description: "Основная консоль - не аксессуар"
  },
  {
    query: "Дисковод Sony для Playstation 5 Pro",
    productName: "Дисковод для Xbox Series X",
    expected: false,
    description: "Аксессуар для Xbox - не PlayStation"
  },
  {
    query: "Дисковод Sony для Playstation 5 Pro",
    productName: "Дисковод для PlayStation 4",
    expected: false,
    description: "Аксессуар для PS4 вместо PS5"
  },
  {
    query: "Зарядная станция PS5",
    productName: "Геймпад для PlayStation 5",
    expected: false,
    description: "Геймпад вместо зарядной станции"
  },
  {
    query: "Геймпад PlayStation 5",
    productName: "Игровая приставка Sony Playstation Portal PS5",
    expected: false,
    description: "Portal - не аксессуар"
  },
  {
    query: "Джойстик PS5",
    productName: "Чехол для телефона",
    expected: false,
    reason: "Не связан с PlayStation"
  }
];

console.log("🧪 Тестирование PlayStation Accessories валидатора (СТРОГАЯ ЛОГИКА)\n");

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

// Дополнительные тесты для extractAccessoryType
console.log("\n🔍 Тестирование извлечения типов аксессуаров:\n");

const accessoryTestCases = [
  "Дисковод Sony для Playstation 5 Pro",
  "Зарядная станция PS5",
  "Геймпад PlayStation 5",
  "Джойстик PS5",
  "Подставка для консоли"
];

accessoryTestCases.forEach(text => {
  const accessoryType = validator.extractAccessoryType(text);
  console.log(`"${text}" -> "${accessoryType}"`);
});

// Тестирование extractModel
console.log("\n🔍 Тестирование извлечения моделей:\n");

const modelTestCases = [
  "Дисковод Sony для Playstation 5 Pro",
  "Зарядная станция PS5",
  "Геймпад PlayStation 5",
  "Джойстик PS5"
];

modelTestCases.forEach(text => {
  const model = validator.extractModel(text);
  console.log(`"${text}" -> "${model}"`);
}); 