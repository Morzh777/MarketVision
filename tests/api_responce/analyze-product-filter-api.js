const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Конфигурация
const OUTPUT_BASE = path.join(__dirname, 'architecture-analysis', 'product-filter');
const PRODUCT_FILTER_URL = 'http://localhost:3001/products/search';

// Тестовые запросы для каждой категории (как в Product-Filter-Service)
const testQueries = {
  videocards: [
    // 'rtx 5070',
    'rtx 5070 ti',
    // 'rtx 5080',
    // 'rtx 5090'
  ],
  // processors: [
  //   '7800x3d',
  //   '9800x3d',
  //   '9950x3d'
  // ],
  // motherboards: [
  //   'Z790',
  //   'B760',
  //   'X870E',
  //   'B850',
  //   'B760M-K'
  // ],
  // playstation: [
  //   'playstation 5',
  //   'playstation 5 pro'
  // ],
  // nintendo_switch: [
  //   'nintendo switch 2',
  // ],
  // steam_deck: [
  //   'steam deck oled'
  // ],
  // iphone: [
  //   'iphone 16 pro',
  //   'iphone 16',
  //   'iphone 15 pro',
  //   'iphone 15',
  //   'iphone 16 pro max',
  //   'iphone 15 pro max',

  // ]
};

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_BASE, { recursive: true });
}

function sanitizeFilename(query) {
  return query
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

async function testProductFilterApi(category, query) {
  console.log(`🔍 Product-Filter: ${category} - "${query}"`);
  const body = {
    queries: [query],
    category
  };
  try {
    const response = await fetch(PRODUCT_FILTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return {
      success: true,
      data,
      query,
      category
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query,
      category
    };
  }
}

async function saveApiResult(category, query, result) {
  const sanitizedQuery = sanitizeFilename(query);
  const dir = path.join(OUTPUT_BASE, category);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${sanitizedQuery}.json`;
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, JSON.stringify(result, null, 2));
  console.log(`💾 Product-Filter данные сохранены: ${path.relative(OUTPUT_BASE, filepath)}`);
  return filepath;
}

async function main() {
  console.log('🚀 АНАЛИЗ Product-Filter-Service (HTTP API)');
  console.log('='.repeat(70));
  console.log(`Product-Filter URL: ${PRODUCT_FILTER_URL}`);
  console.log(`Выходная папка: ${OUTPUT_BASE}`);
  console.log('');

  await ensureOutputDir();
  const allResults = {};

  for (const [category, queries] of Object.entries(testQueries)) {
    console.log(`\n📦 КАТЕГОРИЯ: ${category.toUpperCase()}`);
    console.log('-'.repeat(40));
    allResults[category] = {};
    for (const query of queries) {
      console.log(`\n🔎 Тестируем запрос: "${query}"`);
      const result = await testProductFilterApi(category, query);
      allResults[category][query] = result;
      await saveApiResult(category, query, result);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Сохраняем общие результаты
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryFile = path.join(OUTPUT_BASE, `product-filter-all-results-${timestamp}.json`);
  await fs.writeFile(summaryFile, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Общие результаты сохранены: ${summaryFile}`);

  console.log('\n✅ Анализ завершен!');
  console.log(`📁 Все файлы сохранены в: ${OUTPUT_BASE}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
} 