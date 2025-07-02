const axios = require('axios');

// Конфигурация
const PRODUCT_FILTER_URL = 'http://localhost:3001';
const TEST_QUERIES = {
  videocards: ['rtx 4090', 'rtx 5090', 'rx 7900 xtx'],
  processors: ['14900kf', '14600kf', 'ryzen 7 7800x3d'],
  motherboards: ['X870E', 'B850', 'Z890']
};

/**
 * Тестирует основной endpoint поиска продуктов
 */
async function testProductSearch() {
  console.log('🧪 Тестирование поиска продуктов...\n');

  for (const [category, queries] of Object.entries(TEST_QUERIES)) {
    console.log(`📋 Тестируем категорию: ${category}`);
    console.log(`🔍 Запросы: ${queries.join(', ')}`);

    try {
      const response = await axios.post(`${PRODUCT_FILTER_URL}/products/search`, {
        queries: queries,
        category: category,
        exclude_keywords: ['кабель', 'адаптер', 'блок питания']
      });

      const data = response.data;
      
      console.log(`✅ Успешно получено ${data.total_products} продуктов`);
      console.log(`⏱️ Время обработки: ${data.processing_time_ms}ms`);
      console.log(`📊 Кэш: ${data.cache_hits} hits, ${data.cache_misses} misses`);
      
      if (data.products.length > 0) {
        console.log('📦 Продукты:');
        data.products.forEach((product, index) => {
          const discount = product.discount_percent ? ` (скидка ${product.discount_percent.toFixed(1)}%)` : '';
          const isNew = product.is_new ? ' 🆕' : '';
          console.log(`  ${index + 1}. ${product.name} - ${product.price}₽${discount}${isNew} [${product.source}]`);
        });
      } else {
        console.log('❌ Продукты не найдены');
      }
      
    } catch (error) {
      console.error(`❌ Ошибка для категории ${category}:`, error.response?.data || error.message);
    }
    
    console.log(''); // Пустая строка для разделения
  }
}

/**
 * Тестирует health check
 */
async function testHealthCheck() {
  console.log('🏥 Тестирование health check...\n');

  try {
    const response = await axios.get(`${PRODUCT_FILTER_URL}/products/health`);
    const data = response.data;
    
    console.log(`✅ Статус: ${data.status}`);
    console.log(`🕐 Время: ${data.timestamp}`);
    console.log('🔧 Сервисы:');
    console.log(`  - Redis: ${data.services.redis.status}`);
    console.log(`  - WB API: ${data.services.wb_api.status}`);
    console.log(`  - Ozon API: ${data.services.ozon_api.status}`);
    
  } catch (error) {
    console.error('❌ Ошибка health check:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * Тестирует очистку кэша
 */
async function testCacheClear() {
  console.log('🗑️ Тестирование очистки кэша...\n');

  for (const category of Object.keys(TEST_QUERIES)) {
    try {
      const response = await axios.post(`${PRODUCT_FILTER_URL}/products/cache/clear/${category}`);
      const data = response.data;
      
      console.log(`✅ ${data.message}`);
      
    } catch (error) {
      console.error(`❌ Ошибка очистки кэша для ${category}:`, error.response?.data || error.message);
    }
  }
  
  console.log('');
}

/**
 * Тестирует статистику кэша
 */
async function testCacheStats() {
  console.log('📊 Тестирование статистики кэша...\n');

  try {
    const response = await axios.get(`${PRODUCT_FILTER_URL}/products/cache/stats`);
    const data = response.data;
    
    console.log(`📈 Всего ключей: ${data.total_keys}`);
    console.log('📋 По категориям:');
    Object.entries(data.categories).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * Тестирует повторные запросы для проверки кэша
 */
async function testCacheBehavior() {
  console.log('🔄 Тестирование поведения кэша...\n');

  const testQuery = {
    queries: ['rtx 4090'],
    category: 'videocards'
  };

  console.log('📋 Первый запрос (должен быть cache miss):');
  try {
    const response1 = await axios.post(`${PRODUCT_FILTER_URL}/products/search`, testQuery);
    const data1 = response1.data;
    console.log(`  - Продуктов: ${data1.total_products}`);
    console.log(`  - Кэш: ${data1.cache_hits} hits, ${data1.cache_misses} misses`);
  } catch (error) {
    console.error('  ❌ Ошибка:', error.response?.data || error.message);
  }

  console.log('\n📋 Второй запрос (должен быть cache hit):');
  try {
    const response2 = await axios.post(`${PRODUCT_FILTER_URL}/products/search`, testQuery);
    const data2 = response2.data;
    console.log(`  - Продуктов: ${data2.total_products}`);
    console.log(`  - Кэш: ${data2.cache_hits} hits, ${data2.cache_misses} misses`);
  } catch (error) {
    console.error('  ❌ Ошибка:', error.response?.data || error.message);
  }
  
  console.log('');
}

/**
 * Основная функция тестирования
 */
async function runTests() {
  console.log('🚀 Запуск тестов Product Filter Service Integration\n');
  console.log('=' .repeat(60));

  try {
    await testHealthCheck();
    await testProductSearch();
    await testCacheBehavior();
    await testCacheStats();
    await testCacheClear();
    
    console.log('✅ Все тесты завершены!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

// Запуск тестов
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testProductSearch,
  testHealthCheck,
  testCacheClear,
  testCacheStats,
  testCacheBehavior
}; 