const { NintendoSwitchValidator } = require('./monorepo-root/product-filter-service/dist/services/validation.service/category/nintendo-switch.validator');

// Создаем экземпляр валидатора
const validator = new NintendoSwitchValidator();

// Проблемные товары из логов, которые должны быть отфильтрованы
const problematicProducts = [
  {
    name: "Панель для Nintendo Switch в аниме стиле Ц Чёрный Логотип",
    query: "nintendo switch 2",
    expected: false,
    reason: "accessory"
  },
  {
    name: "Nintendo Switch OLED Белый",
    query: "nintendo switch 2", 
    expected: false,
    reason: "no-model-match"
  },
  {
    name: "Switch OLED 64 Гб, неоновый",
    query: "nintendo switch 2",
    expected: false,
    reason: "no-model-match"
  }
];

// Валидные товары Switch 2 (включая подарочные наборы)
const validProducts = [
  {
    name: "Игровая приставка Switch 2 256ГБ Глобальная версия Черный",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Игровая консоль Switch 2",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Switch 2, 256 ГБ, черный",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Игровая приставка Switch 2 Без игр",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  // Подарочные наборы с играми
  {
    name: "Игровая приставка Switch 2 + игра Mario Kart World Черный",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Игровой набор Switch 2 (включая Mario Kart World)",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Игровая консоль Switch 2 + Mario Kart World",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Nintendo Switch 2 с игрой Mario Kart World",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Игровая приставка Switch 2 Mario Kart Bundle",
    query: "nintendo switch 2",
    expected: true,
    reason: "model-match"
  }
];

console.log('🧪 Тестирование исправленного валидатора Nintendo Switch\n');

console.log('❌ Проблемные товары (должны быть отфильтрованы):');
problematicProducts.forEach((product, index) => {
  const result = validator.validate('nintendo_switch', product.query, product.name);
  const status = result.isValid === product.expected ? '✅' : '❌';
  console.log(`${status} ${index + 1}. "${product.name}"`);
  console.log(`   Ожидалось: ${product.expected} (${product.reason}), Получено: ${result.isValid} (${result.reason})`);
  console.log('');
});

console.log('✅ Валидные товары Switch 2 (включая подарочные наборы):');
validProducts.forEach((product, index) => {
  const result = validator.validate('nintendo_switch', product.query, product.name);
  const status = result.isValid === product.expected ? '✅' : '❌';
  console.log(`${status} ${index + 1}. "${product.name}"`);
  console.log(`   Ожидалось: ${product.expected} (${product.reason}), Получено: ${result.isValid} (${result.reason})`);
  console.log('');
}); 