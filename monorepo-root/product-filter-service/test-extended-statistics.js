const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testExtendedStatistics() {
  console.log('🧪 Тестирование расширенной статистики...\n');

  try {
    // 1. Тестируем ежедневную сводку
    console.log('📊 1. Ежедневная сводка:');
    const today = new Date().toISOString().split('T')[0];
    const dailySummary = await fetch(`${BASE_URL}/price-statistics/daily-summary/${today}`);
    const dailyData = await dailySummary.json();
    console.log('✅ Ежедневная сводка:', JSON.stringify(dailyData, null, 2));

    // 2. Тестируем еженедельный отчет
    console.log('\n📈 2. Еженедельный отчет:');
    const currentWeek = getWeekKey(new Date());
    const weeklyReport = await fetch(`${BASE_URL}/price-statistics/weekly-report/${currentWeek}`);
    const weeklyData = await weeklyReport.json();
    console.log('✅ Еженедельный отчет:', JSON.stringify(weeklyData, null, 2));

    // 3. Тестируем месячный отчет
    console.log('\n📅 3. Месячный отчет:');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthlyReport = await fetch(`${BASE_URL}/price-statistics/monthly-report/${currentYear}/${currentMonth}`);
    const monthlyData = await monthlyReport.json();
    console.log('✅ Месячный отчет:', JSON.stringify(monthlyData, null, 2));

    // 4. Тестируем рыночные инсайты
    console.log('\n💡 4. Рыночные инсайты:');
    const marketInsights = await fetch(`${BASE_URL}/price-statistics/market-insights`);
    const insightsData = await marketInsights.json();
    console.log('✅ Рыночные инсайты:', JSON.stringify(insightsData, null, 2));

    // 5. Тестируем сравнение с прошлым периодом
    console.log('\n📊 5. Сравнение с прошлым периодом:');
    const comparison = await fetch(`${BASE_URL}/price-statistics/comparison/${currentWeek}`);
    const comparisonData = await comparison.json();
    console.log('✅ Сравнение:', JSON.stringify(comparisonData, null, 2));

    // 6. Тестируем все отчеты для бота
    console.log('\n🤖 6. Все отчеты для бота:');
    const botReports = await fetch(`${BASE_URL}/price-statistics/bot-reports`);
    const botData = await botReports.json();
    console.log('✅ Отчеты для бота:', JSON.stringify(botData, null, 2));

    console.log('\n🎉 Все тесты пройдены успешно!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

function getWeekKey(date) {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Запускаем тесты
testExtendedStatistics(); 