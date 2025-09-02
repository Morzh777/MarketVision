const fetch = require('node-fetch');
const https = require('https');

// Конфигурация
const PRODUCT_FILTER_URL = 'https://localhost/products';

async function testParsingTrigger() {
  console.log('🚀 Тестирование запуска парсинга через Product-Filter сервис');
  console.log('='.repeat(60));

  // Тестовый запрос - только указание на категорию для парсинга
  const testRequest = {
    categoryKey: 'videocards' // Категория для парсинга
  };

  try {
    console.log(`📤 Отправляем запрос:`, testRequest);
    
    const response = await fetch(`${PRODUCT_FILTER_URL}/parsing/trigger`, {
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
    
    console.log(`📥 Ответ сервера (статус: ${response.status}):`);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`✅ Парсинг успешно запущен!`);
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
testParsingTrigger();
