const fetch = require('node-fetch');
const https = require('https');

// Конфигурация
const MARKETVISION_API_URL = 'https://localhost/api';

async function testParsingThroughMarketVision() {
  console.log('🚀 Тестирование запуска парсинга через MarketVision API');
  console.log('='.repeat(60));

  // Тестовый запрос - только указание на категорию для парсинга
  const testRequest = {
    categoryKey: 'videocards' // Категория для парсинга
  };

  try {
    console.log(`📤 Отправляем запрос в MarketVision API:`, testRequest);
    
    const response = await fetch(`${MARKETVISION_API_URL}/parsing/trigger`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(testRequest),
      // Игнорируем SSL сертификаты для локальной разработки
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    const result = await response.json();
    
    console.log(`📥 Ответ MarketVision API (статус: ${response.status}):`);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Парсинг успешно запущен через MarketVision API!`);
      console.log(`📋 Обработано запросов: ${result.data?.queries_processed || 0}`);
      console.log(`📊 Найдено товаров: ${result.data?.total_products_found || 0}`);
      console.log(`⏱️ Время обработки: ${result.data?.processing_time_ms || 0}ms`);
      
      if (result.data?.results) {
        console.log(`\n📝 Детали по запросам:`);
        result.data.results.forEach((r, i) => {
          console.log(`  ${i + 1}. "${r.query}" (${r.platform}): ${r.products_found} товаров`);
        });
      }
    } else {
      console.log(`❌ Ошибка при запуске парсинга: ${result.message}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

// Запускаем тест
testParsingThroughMarketVision();
