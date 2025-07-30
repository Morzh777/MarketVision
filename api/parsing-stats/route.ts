import { NextResponse } from 'next/server';

const DB_API_URL = process.env.DB_API_URL || 'http://localhost:3003';

async function fetchFromDB(endpoint: string) {
  try {
    const response = await fetch(`${DB_API_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10 секунд таймаут
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Ошибка запроса к ${endpoint}:`, error);
    throw error;
  }
}

export async function GET() {
  try {
    console.log('📊 Загрузка статистики парсинга...');

    // Параллельно загружаем данные
    const [
      allProducts,
      marketStats
    ] = await Promise.all([
      fetchFromDB('/api/products?limit=10000'), // Все продукты для статистики
      fetchFromDB('/api/market-stats') // Статистика по категориям  
    ]);

    const products = allProducts.products || [];
    const totalProducts = products.length;

    // Статистика по категориям
    const categoriesStats: Record<string, any> = {};
    const sourcesStats: Record<string, any> = {};
    const priceDistribution: Record<string, number> = {
      '0-1000': 0,
      '1000-5000': 0, 
      '5000-10000': 0,
      '10000-25000': 0,
      '25000-50000': 0,
      '50000-100000': 0,
      '100000+': 0
    };

    // Обрабатываем все продукты
    products.forEach((product: any) => {
      const category = product.category || 'unknown';
      const source = product.source || 'unknown';
      const price = parseFloat(product.price) || 0;

      // Статистика категорий
      if (!categoriesStats[category]) {
        categoriesStats[category] = {
          productCount: 0,
          prices: [],
          lastParsed: product.createdAt
        };
      }
      categoriesStats[category].productCount++;
      categoriesStats[category].prices.push(price);
      
      // Обновляем последнюю дату парсинга
      if (new Date(product.createdAt) > new Date(categoriesStats[category].lastParsed)) {
        categoriesStats[category].lastParsed = product.createdAt;
      }

      // Статистика источников
      if (!sourcesStats[source]) {
        sourcesStats[source] = { productCount: 0 };
      }
      sourcesStats[source].productCount++;

      // Распределение цен
      if (price === 0) priceDistribution['0-1000']++;
      else if (price < 1000) priceDistribution['0-1000']++;
      else if (price < 5000) priceDistribution['1000-5000']++;
      else if (price < 10000) priceDistribution['5000-10000']++;
      else if (price < 25000) priceDistribution['10000-25000']++;
      else if (price < 50000) priceDistribution['25000-50000']++;
      else if (price < 100000) priceDistribution['50000-100000']++;
      else priceDistribution['100000+']++;
    });

    // Вычисляем средние цены и диапазоны для категорий
    Object.keys(categoriesStats).forEach(category => {
      const prices = categoriesStats[category].prices;
      if (prices.length > 0) {
        categoriesStats[category].avgPrice = Math.round(
          prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
        );
        categoriesStats[category].priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices)
        };
      }
      delete categoriesStats[category].prices; // Удаляем массив цен
    });

    // Вычисляем проценты для источников
    Object.keys(sourcesStats).forEach(source => {
      sourcesStats[source].percentage = Math.round(
        (sourcesStats[source].productCount / totalProducts) * 100
      );
    });

    // Статистика активности
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivity = {
      last24h: products.filter((p: any) => new Date(p.createdAt) > last24h).length,
      last7days: products.filter((p: any) => new Date(p.createdAt) > last7days).length,
      last30days: products.filter((p: any) => new Date(p.createdAt) > last30days).length
    };

    // Топ продукты (самые дорогие)
    const topProducts = products
      .sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, 10)
      .map((product: any) => ({
        name: product.name,
        price: parseFloat(product.price),
        category: product.category,
        source: product.source,
        createdAt: product.createdAt
      }));

    // История парсинга по дням (последние 7 дней)
    const parsingHistory = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayProducts = products.filter((p: any) => {
        const productDate = new Date(p.createdAt);
        return productDate >= dayStart && productDate < dayEnd;
      });

      const dayCategories = [...new Set(dayProducts.map((p: any) => p.category))];

      parsingHistory.push({
        date: date.toISOString().split('T')[0],
        count: dayProducts.length,
        categories: dayCategories
      });
    }

    const stats = {
      totalProducts,
      totalParsingSessions: parsingHistory.reduce((sum, day) => sum + (day.count > 0 ? 1 : 0), 0),
      categoriesStats,
      sourcesStats,
      recentActivity,
      topProducts,
      priceDistribution,
      parsingHistory
    };

    console.log(`✅ Статистика собрана: ${totalProducts} товаров, ${Object.keys(categoriesStats).length} категорий`);

    return NextResponse.json({
      stats,
      lastUpdate: new Date().toISOString(),
      success: true
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Отключаем кэширование для статистики!
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('❌ Ошибка получения статистики парсинга:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch parsing statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
} 