const { VideocardValidator } = require('./videocard-validator');

console.log('🧪 ТЕСТИРОВАНИЕ ВАЛИДАТОРА ВИДЕОКАРТ');
console.log('=' .repeat(50));

const validator = new VideocardValidator();

// Тестовые случаи
const testCases = [
  // Запрос: "5070"
  {
    query: '5070',
    products: [
      'RTX 5070',
      'RTX 5070 Ti', 
      'RTX 4070',
      'GTX 1660'
    ],
    expected: [true, false, false, false] // 5070 должен пройти, 5070 Ti НЕТ, 4070 НЕТ
  },
  
  // Запрос: "5070TI"
  {
    query: '5070TI',
    products: [
      'RTX 5070',
      'RTX 5070 Ti',
      'RTX 4070 Ti'
    ],
    expected: [false, true, false] // 5070 НЕТ, 5070 Ti ДА, 4070 Ti НЕТ
  },
  
  // Запрос: "RTX5070"
  {
    query: 'RTX5070',
    products: [
      'RTX 5070',
      'RTX 5070 Ti',
      'GTX 5070'
    ],
    expected: [true, false, false] // RTX 5070 ДА, RTX 5070 Ti НЕТ, GTX 5070 НЕТ
  },
  
  // Запрос: "RTX 5070 Ti"
  {
    query: 'RTX 5070 Ti',
    products: [
      'RTX 5070',
      'RTX 5070 Ti',
      'RTX 4070 Ti'
    ],
    expected: [false, true, false] // 5070 НЕТ, 5070 Ti ДА, 4070 Ti НЕТ
  }
];

// Запускаем тесты
testCases.forEach((testCase, testIndex) => {
  console.log(`\n📋 ТЕСТ ${testIndex + 1}: Запрос "${testCase.query}"`);
  console.log('-'.repeat(40));
  
  testCase.products.forEach((product, productIndex) => {
    const result = validator.validate(testCase.query, product);
    const expected = testCase.expected[productIndex];
    const status = result.isValid === expected ? '✅' : '❌';
    
    console.log(`${status} "${product}" -> ${result.isValid ? 'ПРОШЕЛ' : 'НЕ ПРОШЕЛ'} (ожидалось: ${expected ? 'ПРОШЕЛ' : 'НЕ ПРОШЕЛ'})`);
    console.log(`   Причина: ${result.reason}`);
  });
});

console.log('\n🎯 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!'); 