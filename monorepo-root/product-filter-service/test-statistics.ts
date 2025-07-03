import { createClient } from 'redis';

async function addTestStatistics() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  await client.connect();

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Тестовые данные изменений цен
  const testChanges = [
    {
      query: 'rtx5080',
      category: 'videocards',
      oldPrice: 85000,
      newPrice: 82000,
      changePercent: -3.5,
      changeType: 'decrease' as const,
      productName: 'RTX 5080 Gaming X',
      source: 'wb',
      timestamp: now.toISOString()
    },
    {
      query: '7800x3d',
      category: 'processors',
      oldPrice: 45000,
      newPrice: 43000,
      changePercent: -4.4,
      changeType: 'decrease' as const,
      productName: 'AMD Ryzen 7 7800X3D',
      source: 'ozon',
      timestamp: now.toISOString()
    },
    {
      query: 'rtx5070',
      category: 'videocards',
      oldPrice: 65000,
      newPrice: 68000,
      changePercent: 4.6,
      changeType: 'increase' as const,
      productName: 'RTX 5070 Gaming',
      source: 'wb',
      timestamp: now.toISOString()
    }
  ];

  // Сохраняем тестовые данные
  for (const change of testChanges) {
    const dailyKey = `price_stats:daily:${today}:${change.category}:${change.query}`;
    const weeklyKey = `price_stats:weekly:2025-W27:${change.category}:${change.query}`;
    
    await client.set(dailyKey, JSON.stringify(change));
    await client.set(weeklyKey, JSON.stringify(change));
    
    console.log(`✅ Добавлен тестовый change: ${change.query} - ${change.changeType}`);
  }

  console.log('🎉 Тестовые данные статистики добавлены!');
  await client.disconnect();
}

addTestStatistics().catch(console.error); 