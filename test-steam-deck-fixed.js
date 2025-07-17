const { SteamDeckValidator } = require('./monorepo-root/product-filter-service/dist/services/validation.service/category/steam-deck.validator');

// Создаем экземпляр валидатора
const validator = new SteamDeckValidator();

// Проблемные товары из логов, которые должны быть отфильтрованы
const problematicProducts = [
  {
    name: "Накладки на стики лапки для Steam Deck Стим Дек",
    query: "steam deck oled",
    expected: false,
    reason: "accessory"
  },
  {
    name: "Силиконовый чехол для SteamDeck OLED",
    query: "steam deck oled", 
    expected: false,
    reason: "accessory"
  },
  {
    name: "Силиконовый защитный чехол для OLED",
    query: "steam deck oled",
    expected: false,
    reason: "accessory"
  },
  {
    name: "Защитный чехол для OLED",
    query: "steam deck oled",
    expected: false,
    reason: "accessory"
  },
  {
    name: "Чехол для Steam Deck Basic Set PC0104",
    query: "steam deck oled",
    expected: false,
    reason: "accessory"
  },
  {
    name: "Док-станция Steam Deck, OLED, ROG Ally Стандартная версия",
    query: "steam deck oled",
    expected: false,
    reason: "accessory"
  },
  {
    name: "Силиконовый защитный чехол для Steam Deck OLED",
    query: "steam deck oled",
    expected: false,
    reason: "accessory"
  },
  {
    name: "Защитный чехол для Steam Deck OLED",
    query: "steam deck oled",
    expected: false,
    reason: "accessory"
  }
];

// Валидные товары
const validProducts = [
  {
    name: "Портативная игровая консоль Steam Deck OLED 512ГБ",
    query: "steam deck oled",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Steam Deck OLED 512 ГБ",
    query: "steam deck oled",
    expected: true,
    reason: "model-match"
  },
  {
    name: "Игровая приставка Steam Deck OLED 1TB",
    query: "steam deck oled",
    expected: true,
    reason: "model-match"
  }
];

console.log('🧪 Тестирование исправленного валидатора Steam Deck\n');

console.log('❌ Проблемные товары (должны быть отфильтрованы):');
problematicProducts.forEach((product, index) => {
  const result = validator.validate('steam_deck', product.query, product.name);
  const status = result.isValid === product.expected ? '✅' : '❌';
  console.log(`${status} ${index + 1}. "${product.name}"`);
  console.log(`   Ожидалось: ${product.expected} (${product.reason}), Получено: ${result.isValid} (${result.reason})`);
  console.log('');
});

console.log('✅ Валидные товары (должны пройти):');
validProducts.forEach((product, index) => {
  const result = validator.validate('steam_deck', product.query, product.name);
  const status = result.isValid === product.expected ? '✅' : '❌';
  console.log(`${status} ${index + 1}. "${product.name}"`);
  console.log(`   Ожидалось: ${product.expected} (${product.reason}), Получено: ${result.isValid} (${result.reason})`);
  console.log('');
}); 