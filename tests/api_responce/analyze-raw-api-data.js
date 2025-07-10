const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs').promises;
const path = require('path');

// Конфигурация
const WB_API_GRPC_URL = 'localhost:3000';
const OZON_API_GRPC_URL = 'localhost:3002';
const OUTPUT_DIR = path.join(__dirname, 'analysis-output');
const PROTO_PATH = path.join(__dirname, '../raw-product.proto');

// Тестовые запросы для каждой категории (короткие, как в Product-Filter-Service)
const testQueries = {
  videocards: [
    'rtx 5070',
    'rtx 5070 ti', 
    'rtx 5080',
    'rtx 5090'
  ],
  processors: [
    '7800x3d',
    '9800x3d',
    '9950x3d'
  ],
  motherboards: [
    'Z790',
    'B760',
    'X870E',
    'B850'
  ],
  playstation: [
    'PlayStation 5',
    'PS5',
    'PlayStation 5 Slim'
  ],
  playstation_accessories: [
    'Дисковод Sony для Playstation 5 Pro',
  ],
  nintendo_switch: [
    'nintendo switch 2',
    'nintendo switch oled',
  ]
};

// Загрузка proto файла
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const rawProductService = protoDescriptor.raw_product;

const CATEGORY_MAP = {
  videocards: { ozon: 'videokarty-15721', wb: '3274' },
  processors: { ozon: 'protsessory-15726', wb: '3698' },
  motherboards: { ozon: 'materinskie-platy-15725', wb: '3690' },
  playstation: { ozon: 'konsoli-playstation-31751/playstation-79966341', wb: '8829' },
  playstation_accessories: { ozon: 'aksessuary-dlya-igrovyh-pristavok-15810', wb: '5923' },
  nintendo_switch: { ozon: 'igrovye-pristavki-15801/nintendo-26667979', wb: '523' }
};

// 🎮 ПЛАТФОРМЫ ДЛЯ КОНКРЕТНЫХ ЗАПРОСОВ (как в Product-Filter-Service)
const QUERY_PLATFORMS = {
  'nintendo switch 2': '101858153',
  'nintendo switch oled': '101858153',
};

function getPlatformId(query) {
  return QUERY_PLATFORMS[query] || null;
}

async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

function sanitizeFilename(query) {
  // Убираем специальные символы и заменяем пробелы на дефисы
  return query
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Убираем спецсимволы
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .toLowerCase();
}

async function testWBApi(categoryKey, query) {
  console.log(`🔍 WB API gRPC: ${categoryKey} - "${query}"`);
  
  return new Promise((resolve) => {
    const client = new rawProductService.RawProductService(
      WB_API_GRPC_URL,
      grpc.credentials.createInsecure()
    );

    const request = {
      query: query,
      category: CATEGORY_MAP[categoryKey].wb,
      categoryKey
    };

    client.GetRawProducts(request, (error, response) => {
      if (error) {
        console.error(`❌ WB API gRPC error for "${query}":`, error.message);
        resolve({
          success: false,
          error: error.message,
          query,
          category: categoryKey
        });
      } else {
        // В ответе подменяем category на categoryKey для единообразия
        if (response && response.products) {
          response.products.forEach(p => p.category = categoryKey);
        }
        resolve({
          success: true,
          data: response,
          query,
          category: categoryKey
        });
      }
      
      client.close();
    });
  });
}

async function testOzonApi(categoryKey, query) {
  console.log(`🔍 Ozon API gRPC: ${categoryKey} - "${query}"`);
  
  // Определяем платформу для запроса
  const platformId = getPlatformId(query);
  if (platformId) {
    console.log(`🎮 Найдена платформа для "${query}": ${platformId}`);
  }
  
  return new Promise((resolve) => {
    const client = new rawProductService.RawProductService(
      OZON_API_GRPC_URL,
      grpc.credentials.createInsecure()
    );

    const request = {
      query: query,
      category: CATEGORY_MAP[categoryKey].ozon,
      categoryKey,
      platform_id: platformId || undefined
    };

    client.GetRawProducts(request, (error, response) => {
      if (error) {
        console.error(`❌ Ozon API gRPC error for "${query}":`, error.message);
        resolve({
          success: false,
          error: error.message,
          query,
          category: categoryKey,
          platform_id: platformId
        });
      } else {
        // В ответе подменяем category на categoryKey для единообразия
        if (response && response.products) {
          response.products.forEach(p => p.category = categoryKey);
        }
        resolve({
          success: true,
          data: response,
          query,
          category: categoryKey,
          platform_id: platformId
        });
      }
      
      client.close();
    });
  });
}

async function saveApiResult(parser, query, result) {
  const sanitizedQuery = sanitizeFilename(query);
  const filename = `${parser}-${sanitizedQuery}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  await fs.writeFile(filepath, JSON.stringify(result, null, 2));
  console.log(`💾 ${parser.toUpperCase()} данные сохранены: ${filename}`);
  
  return filepath;
}

async function analyzeResults(results) {
  console.log('\n📊 АНАЛИЗ РЕЗУЛЬТАТОВ:');
  console.log('='.repeat(50));
  
  for (const [category, categoryResults] of Object.entries(results)) {
    console.log(`\n🎯 ${category.toUpperCase()}:`);
    
    for (const [query, queryResults] of Object.entries(categoryResults)) {
      console.log(`\n  Запрос: "${query}"`);
      
      // WB API анализ
      const wbResult = queryResults.wb;
      if (wbResult.success) {
        const products = wbResult.data?.products || [];
        console.log(`    WB API gRPC: ✅ ${products.length} товаров`);
        
        if (products.length > 0) {
          const sample = products[0];
          console.log(`      Пример: ${sample.name} - ${sample.price}₽`);
          console.log(`      Поля: ${Object.keys(sample).join(', ')}`);
          console.log(`      Запрос: "${sample.query}" (source: ${sample.source})`);
        }
      } else {
        console.log(`    WB API gRPC: ❌ ${wbResult.error}`);
      }
      
      // Ozon API анализ
      const ozonResult = queryResults.ozon;
      if (ozonResult.success) {
        const products = ozonResult.data?.products || [];
        const platformId = ozonResult.platform_id;
        console.log(`    Ozon API gRPC: ✅ ${products.length} товаров`);
        if (platformId) {
          console.log(`      🎮 Платформа: ${platformId}`);
        }
        
        if (products.length > 0) {
          const sample = products[0];
          console.log(`      Пример: ${sample.name} - ${sample.price}₽`);
          console.log(`      Поля: ${Object.keys(sample).join(', ')}`);
          console.log(`      Запрос: "${sample.query}" (source: ${sample.source})`);
        }
      } else {
        console.log(`    Ozon API gRPC: ❌ ${ozonResult.error}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 АНАЛИЗ СЫРЫХ ДАННЫХ WB API И OZON API (gRPC)');
  console.log('='.repeat(70));
  console.log(`WB API gRPC: ${WB_API_GRPC_URL}`);
  console.log(`Ozon API gRPC: ${OZON_API_GRPC_URL}`);
  console.log(`Proto файл: ${PROTO_PATH}`);
  console.log(`Выходная папка: ${OUTPUT_DIR}`);
  console.log('');

  await ensureOutputDir();
  
  const allResults = {};
  
  for (const [categoryKey, queries] of Object.entries(testQueries)) {
    console.log(`\n📦 КАТЕГОРИЯ: ${categoryKey.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    allResults[categoryKey] = {};
    
    for (const query of queries) {
      console.log(`\n🔎 Тестируем запрос: "${query}"`);
      
      // Последовательные запросы к gRPC сервисам
      const wbResult = await testWBApi(categoryKey, query);
      const ozonResult = await testOzonApi(categoryKey, query);
      
      allResults[categoryKey][query] = {
        wb: wbResult,
        ozon: ozonResult,
        timestamp: new Date().toISOString()
      };
      
      // Сохраняем отдельные файлы для каждого API и запроса
      await saveApiResult('wb', query, wbResult);
      await saveApiResult('ozon', query, ozonResult);
      
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Сохраняем общие результаты
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryFile = path.join(OUTPUT_DIR, `all-results-${timestamp}.json`);
  await fs.writeFile(summaryFile, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Общие результаты сохранены: ${summaryFile}`);
  
  // Анализируем результаты
  await analyzeResults(allResults);
  
  console.log('\n✅ Анализ завершен!');
  console.log(`📁 Все файлы сохранены в: ${OUTPUT_DIR}`);
  console.log('\n📋 Примеры созданных файлов:');
  console.log(`   • wb-rtx5070.json - WB API данные для RTX 5070`);
  console.log(`   • ozon-rtx5070.json - Ozon API данные для RTX 5070`);
  console.log(`   • wb-7800x3d.json - WB API данные для процессора`);
  console.log(`   • ozon-7800x3d.json - Ozon API данные для процессора`);
  console.log(`   • wb-nintendo-switch-2.json - WB API данные для Nintendo Switch 2`);
  console.log(`   • ozon-nintendo-switch-2.json - Ozon API данные для Nintendo Switch 2 (с платформой)`);
  console.log(`   • all-results-${timestamp}.json - общие результаты`);
}

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанная ошибка:', reason);
  process.exit(1);
});

// Запуск
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = {
  testWBApi,
  testOzonApi,
  testQueries
};