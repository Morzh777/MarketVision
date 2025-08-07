const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPriceHistory() {
  try {
    console.log('🔍 Проверяем данные для "rtx 5070"...\n');

    // Общее количество записей
    const totalRecords = await prisma.priceHistory.count({
      where: { query: 'rtx 5070' }
    });
    console.log(`📊 Общее количество записей: ${totalRecords}`);

    // Уникальные цены
    const uniquePrices = await prisma.priceHistory.findMany({
      where: { query: 'rtx 5070' },
      select: { price: true },
      distinct: ['price']
    });
    console.log(`💰 Уникальных цен: ${uniquePrices.length}`);

    // Последние 10 записей
    const recentRecords = await prisma.priceHistory.findMany({
      where: { query: 'rtx 5070' },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        price: true,
        source: true,
        created_at: true
      }
    });

    console.log('\n📅 Последние 10 записей:');
    recentRecords.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}, Цена: ${record.price}₽, Источник: ${record.source}, Дата: ${record.created_at.toISOString()}`);
    });

    // Статистика по источникам
    const sourceStats = await prisma.priceHistory.groupBy({
      by: ['source'],
      where: { query: 'rtx 5070' },
      _count: { source: true }
    });

    console.log('\n📈 Статистика по источникам:');
    sourceStats.forEach(stat => {
      console.log(`- ${stat.source}: ${stat._count.source} записей`);
    });

    // Минимальная и максимальная цена
    const priceStats = await prisma.priceHistory.aggregate({
      where: { query: 'rtx 5070' },
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });

    console.log('\n💰 Статистика цен:');
    console.log(`- Минимальная: ${priceStats._min.price}₽`);
    console.log(`- Максимальная: ${priceStats._max.price}₽`);
    console.log(`- Средняя: ${Math.round(priceStats._avg.price)}₽`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPriceHistory(); 