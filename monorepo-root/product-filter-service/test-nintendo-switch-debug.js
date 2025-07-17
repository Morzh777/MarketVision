const { NintendoSwitchValidator } = require('./dist/src/services/validation.service/category/nintendo-switch.validator');

async function testNintendoSwitchValidator() {
  const validator = new NintendoSwitchValidator();
  
  const testCases = [
    // Прошитые консоли - должны быть отклонены
    {
      name: "Switch 2 ревизия Прошитая Игровая приставка неон",
      query: "nintendo switch 2",
      expected: false
    },
    {
      name: "Switch 2рев Прошитая Игровая приставка серая", 
      query: "nintendo switch 2",
      expected: false
    },
    {
      name: "Прошитая Nintendo Switch OLED Neon Blue Red 128 GB (Новая)",
      query: "nintendo switch oled",
      expected: false
    },
    {
      name: "Nintendo Switch OLED Прошитая игровая приставка + 220 игр",
      query: "nintendo switch oled", 
      expected: false
    },
    {
      name: "Игровая приставка Switch OLED White 256 Gb HWFLY",
      query: "nintendo switch oled",
      expected: false
    },
    
    // Официальные консоли - должны пройти
    {
      name: "Игровая приставка Switch 2 256ГБ Глобальная версия Черный",
      query: "nintendo switch 2",
      expected: true
    },
    {
      name: "Игровая приставка Switch 2 + игра Mario Kart World Черный",
      query: "nintendo switch 2", 
      expected: true
    },
    {
      name: "Nintendo Switch OLED Неоновый",
      query: "nintendo switch oled",
      expected: true
    }
  ];

  console.log('🧪 Тестирование Nintendo Switch Validator\n');

  for (const testCase of testCases) {
    console.log(`\n📦 Тест: "${testCase.name}"`);
    console.log(`🔍 Запрос: "${testCase.query}"`);
    
    const result = await validator.validateSingleProduct(testCase.query, testCase.name, 'nintendo_switch');
    
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

testNintendoSwitchValidator().catch(console.error); 