const { PlaystationValidator } = require('./dist/src/services/validation.service/category/playstation.validator');

async function testPlaystationValidator() {
  const validator = new PlaystationValidator();
  
  const testCases = [
    // PS5 Pro - должны пройти
    {
      name: "Игровая консоль PlayStation 5 Pro",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "Playstation 5 Pro",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "Игровая приставка PlayStation 5 Pro Digital Edition 2ТБ",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "PlayStation 5 Pro Digital Edition,2000 ГБ SSD+ 2 геймпада",
      query: "playstation 5 pro",
      expected: true
    },
    
    // PS5 - должны пройти
    {
      name: "Игровая приставка PlayStation 5 Slim Digital Edition",
      query: "playstation 5",
      expected: true
    },
    {
      name: "Игровая консоль PlayStation 5 Slim Blu-Ray CFI-2000A Япония",
      query: "playstation 5",
      expected: true
    },
    {
      name: "PlayStation 5",
      query: "playstation 5",
      expected: true
    },
    
    // Аксессуары - должны быть отклонены
    {
      name: "Беспроводной контроллер PlayStation 5 DualSense",
      query: "playstation 5",
      expected: false
    },
    {
      name: "Зарядная станция DualSense для PS 5",
      query: "playstation 5",
      expected: false
    },
    {
      name: "Подставка для PS5 горизонтальная стойка",
      query: "playstation 5",
      expected: false
    },
    {
      name: "PS5 Pro Slim Станция заряда с охлаждением",
      query: "playstation 5 pro",
      expected: false
    },
    {
      name: "PS5 Pro",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "PS5 + Pro Controller",
      query: "playstation 5 pro",
      expected: false
    },
    {
      name: "Playstation 5 Pro",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "PS5 Pro",
      query: "playstation 5 pro",
      expected: false
    },
    {
      name: "playstation5pro",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "ps5 pro",
      query: "playstation 5 pro",
      expected: false
    },
    {
      name: "ps5pro",
      query: "playstation 5 pro",
      expected: false
    },
    {
      name: "PS5 Pro Slim",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "PS5 Pro 2",
      query: "playstation 5 pro",
      expected: true
    },
    {
      name: "PS5 Pro Slim",
      query: "playstation 5 pro",
      expected: false
    },
    {
      name: "PS5 Pro Станция заряда",
      query: "playstation 5 pro",
      expected: false
    }
  ];

  console.log('🧪 Тестирование PlayStation Validator\n');

  for (const testCase of testCases) {
    console.log(`\n📦 Тест: "${testCase.name}"`);
    console.log(`🔍 Запрос: "${testCase.query}"`);
    
    const result = await validator.validateSingleProduct(testCase.query, testCase.name, 'playstation');
    
    console.log(`✅ Результат: ${result.isValid ? 'ПРОШЕЛ' : 'ОТКЛОНЕН'} (ожидалось: ${testCase.expected ? 'ПРОШЕЛ' : 'ОТКЛОНЕН'})`);
    console.log(`📝 Причина: ${result.reason}`);
    console.log(`🎯 Уверенность: ${result.confidence}`);
    
    if (result.isValid !== testCase.expected) {
      console.log(`❌ ОШИБКА: Результат не соответствует ожиданию!`);
    } else {
      console.log(`✅ УСПЕХ: Результат соответствует ожиданию`);
    }
  }
}

testPlaystationValidator().catch(console.error); 