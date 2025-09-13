// Полный тест валидатора iPhone с покрытием всех этапов валидации

// Имитируем все методы из ProductValidatorBase и IphoneValidator
class TestIphoneValidator {
  constructor() {
    this.CATEGORY_KEY = 'iphone';
    this.IPHONE_RULES = {
      accessoryWords: [
        'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
        'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив',
        'корпус', 'вкорпусе', 'кейс', 'бампер', 'накладка', 'пленка', 'плёнка',
        'реплика', 'встиле', 'стиле', 'стилизован'
      ]
    };
  }

  normalize(str) {
    return str.toLowerCase().replace(/\s+/g, '');
  }

  getOtherModels() {
    return [
      'iphone16', 'iphone15', 'iphone14', 'iphone13', 'iphone12', 'iphone11',
      'iphone16pro', 'iphone15pro', 'iphone14pro', 'iphone13pro', 'iphone12pro', 'iphone11pro',
      'iphone16promax', 'iphone15promax', 'iphone14promax', 'iphone13promax', 'iphone12promax', 'iphone11promax',
      'iphone16plus', 'iphone15plus', 'iphone14plus', 'iphone13mini', 'iphone12mini',
      'iphonexr', 'iphonexs', 'iphonexsmax', 'iphonex',
      'iphone8', 'iphone8plus', 'iphone7', 'iphone7plus',
      'iphone6', 'iphone6s', 'iphone6plus', 'iphone6splus',
      'iphone5', 'iphone5s', 'iphonese', 'iphonese2'
    ];
  }

  isAccessory(normalizedName, accessoryWords) {
    return accessoryWords.some(word => normalizedName.includes(word));
  }

  validateNameQueryMatch(normalizedName, normalizedQuery) {
    console.log(`  🔍 Сравнение: "${normalizedName}" содержит "${normalizedQuery}"?`);
    const result = normalizedName.includes(normalizedQuery);
    console.log(`  ✅ Результат: ${result}`);
    return result;
  }

  checkOtherModels(normalizedQuery, normalizedName, otherModels, categoryName) {
    const checks = [];
    
    // Проверяем, есть ли в запросе другие модели iPhone
    const queryHasOtherModel = otherModels.some(model => 
      normalizedQuery.includes(model) && model !== normalizedQuery
    );
    
    if (queryHasOtherModel) {
      const hasOtherModelInName = otherModels.some(model => 
        normalizedName.includes(model) && !normalizedQuery.includes(model)
      );
      
      if (hasOtherModelInName) {
        checks.push({ passed: false, reason: 'other-model-conflict', confidence: 0.9 });
      } else {
        checks.push({ passed: true, reason: 'no-other-model-conflict', confidence: 0.9 });
      }
    } else {
      checks.push({ passed: true, reason: 'no-other-model-check', confidence: 0.9 });
    }
    
    return checks;
  }

  createResult(passed, reason, confidence) {
    return { passed, reason, confidence };
  }

  // Полная валидация как в validateProductStandard
  validateProductStandard(query, name, rules) {
    console.log(`\n🔍 Валидация товара: "${name}"`);
    console.log(`📝 Запрос: "${query}"`);
    
    const normalizedName = this.normalize(name);
    const normalizedQuery = this.normalize(query);
    
    console.log(`🔤 Нормализованное название: "${normalizedName}"`);
    console.log(`🔤 Нормализованный запрос: "${normalizedQuery}"`);

    const checks = [];

    // 1. Проверка на аксессуары
    console.log(`\n1️⃣ Проверка на аксессуары:`);
    if (rules.accessoryWords && this.isAccessory(normalizedName, rules.accessoryWords)) {
      console.log(`  ❌ Товар является аксессуаром`);
      checks.push({ passed: false, reason: 'accessory', confidence: 0.9 });
    } else {
      console.log(`  ✅ Товар не является аксессуаром`);
      checks.push({ passed: true, reason: 'not-accessory', confidence: 0.9 });
    }

    // 2. Проверка множественных моделей (отключена)
    console.log(`\n2️⃣ Проверка множественных моделей:`);
    console.log(`  ✅ Пропущена (отключена)`);
    checks.push({ passed: true, reason: 'single-model', confidence: 0.9 });

    // 3. Проверка соответствия запроса
    console.log(`\n3️⃣ Проверка соответствия запроса:`);
    if (!this.validateNameQueryMatch(normalizedName, normalizedQuery)) {
      console.log(`  ❌ Название не соответствует запросу`);
      checks.push({ passed: false, reason: 'no-match', confidence: 0.7 });
    } else {
      console.log(`  ✅ Название соответствует запросу`);
      checks.push({ passed: true, reason: 'query-match', confidence: 0.8 });
    }

    // 4. Проверка других моделей
    console.log(`\n4️⃣ Проверка других моделей:`);
    const otherModels = this.getOtherModels();
    if (otherModels.length > 0) {
      const otherModelsChecks = this.checkOtherModels(normalizedQuery, normalizedName, otherModels, this.CATEGORY_KEY);
      checks.push(...otherModelsChecks);
      
      otherModelsChecks.forEach(check => {
        console.log(`  ${check.passed ? '✅' : '❌'} ${check.reason} (confidence: ${check.confidence})`);
      });
    } else {
      console.log(`  ✅ Нет других моделей для проверки`);
      checks.push({ passed: true, reason: 'no-other-model-check', confidence: 0.9 });
    }

    // 5. Итоговый результат
    console.log(`\n📊 Итоговые проверки:`);
    checks.forEach((check, index) => {
      console.log(`  ${index + 1}. ${check.passed ? '✅' : '❌'} ${check.reason} (confidence: ${check.confidence})`);
    });

    const failedChecks = checks.filter(check => !check.passed);
    const passed = failedChecks.length === 0;
    
    console.log(`\n🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ: ${passed ? '✅ ВАЛИДАЦИЯ ПРОШЛА' : '❌ ВАЛИДАЦИЯ НЕ ПРОШЛА'}`);
    
    if (!passed) {
      console.log(`❌ Причины отклонения:`);
      failedChecks.forEach(check => {
        console.log(`  - ${check.reason} (confidence: ${check.confidence})`);
      });
    }

    return { passed, checks, failedChecks };
  }

  // Специальная валидация iPhone как в validateProduct
  validateProduct(query, name, rules) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🍎 ВАЛИДАЦИЯ IPHONE: "${name}"`);
    console.log(`📝 Запрос: "${query}"`);
    console.log(`${'='.repeat(80)}`);

    const normalizedName = this.normalize(name);
    const legacyModels = this.getOtherModels();

    // Специальное правило: отбрасываем товары вида "XR в корпусе/в стиле 15 Pro"
    console.log(`\n🔍 Проверка стилизации:`);
    const stylingIndicators = ['вкорпусе', 'корпус', 'встиле', 'стиле', 'стилизован'];
    const hasStyling = stylingIndicators.some((word) => normalizedName.includes(word));
    const hasLegacyModel = legacyModels.some((model) => normalizedName.includes(model));

    console.log(`  - Есть стилизация: ${hasStyling}`);
    console.log(`  - Есть старая модель: ${hasLegacyModel}`);

    if (hasStyling && hasLegacyModel) {
      console.log(`  ❌ Товар стилизован под старую модель - ОТКЛОНЕН`);
      return this.createResult(false, 'iphone-styled-legacy-model', 0.95);
    } else {
      console.log(`  ✅ Товар не стилизован под старую модель`);
    }

    // Отладочная информация для проверки цены
    if (rules.product?.price && rules.recommendedPrice) {
      console.log(`\n💰 Проверка цены:`);
      console.log(`  - Цена товара: ${rules.product.price}₽`);
      console.log(`  - Рекомендованная цена: ${rules.recommendedPrice}₽`);
      console.log(`  - Толерантность: ${rules.dynamicTolerance || 0.3}`);
      
      if (rules.product.price < rules.recommendedPrice * 0.5) {
        console.log(`  🚨 Подозрительно низкая цена!`);
      }
    }

    // Используем стандартную валидацию
    return this.validateProductStandard(query, name, rules);
  }
}

// Тестовые данные
const testCases = [
  {
    name: "iPhone 15 Pro Max 256 ГБ White Titanium восстановленный",
    query: "iPhone 15 Pro Max",
    rules: {
      accessoryWords: [
        'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
        'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив',
        'корпус', 'вкорпусе', 'кейс', 'бампер', 'накладка', 'пленка', 'плёнка',
        'реплика', 'встиле', 'стиле', 'стилизован'
      ],
      product: { price: 120000 },
      recommendedPrice: 150000,
      dynamicTolerance: 0.3
    }
  },
  {
    name: "iPhone 15 Pro Max чехол силиконовый",
    query: "iPhone 15 Pro Max",
    rules: {
      accessoryWords: [
        'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
        'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив',
        'корпус', 'вкорпусе', 'кейс', 'бампер', 'накладка', 'пленка', 'плёнка',
        'реплика', 'встиле', 'стиле', 'стилизован'
      ]
    }
  },
  {
    name: "iPhone XR в корпусе iPhone 15 Pro",
    query: "iPhone 15 Pro",
    rules: {
      accessoryWords: [
        'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
        'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив',
        'корпус', 'вкорпусе', 'кейс', 'бампер', 'накладка', 'пленка', 'плёнка',
        'реплика', 'встиле', 'стиле', 'стилизован'
      ]
    }
  },
  {
    name: "iPhone 15 Pro Max 512GB Natural Titanium",
    query: "iPhone 15 Pro Max",
    rules: {
      accessoryWords: [
        'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
        'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив',
        'корпус', 'вкорпусе', 'кейс', 'бампер', 'накладка', 'пленка', 'плёнка',
        'реплика', 'встиле', 'стиле', 'стилизован'
      ],
      product: { price: 150000 },
      recommendedPrice: 150000,
      dynamicTolerance: 0.3
    }
  }
];

// Запуск тестов
console.log(`🧪 ПОЛНЫЙ ТЕСТ ВАЛИДАТОРА IPHONE`);
console.log(`📅 ${new Date().toLocaleString()}`);
console.log(`\n${'='.repeat(80)}`);

const validator = new TestIphoneValidator();

testCases.forEach((testCase, index) => {
  console.log(`\n\n📱 ТЕСТ ${index + 1}/${testCases.length}`);
  const result = validator.validateProduct(testCase.query, testCase.name, testCase.rules);
  
  console.log(`\n${'='.repeat(40)}`);
  console.log(`📊 РЕЗУЛЬТАТ ТЕСТА ${index + 1}: ${result.passed ? '✅ ПРОШЕЛ' : '❌ НЕ ПРОШЕЛ'}`);
  console.log(`${'='.repeat(40)}`);
});

console.log(`\n\n🏁 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ`);



