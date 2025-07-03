import { createClient } from 'redis';

async function checkRedisData() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  await client.connect();

  const today = new Date().toISOString().split('T')[0];
  
  // Проверяем ежедневные данные
  const dailyKeys = await client.keys(`price_stats:daily:${today}:*`);
  console.log(`📅 Найдено ${dailyKeys.length} ежедневных записей:`);
  
  for (const key of dailyKeys) {
    const data = await client.get(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`  ${key}: ${parsed.query} - ${parsed.changeType} (${parsed.oldPrice} → ${parsed.newPrice})`);
    }
  }

  // Проверяем еженедельные данные
  const weeklyKeys = await client.keys('price_stats:weekly:2025-W27:*');
  console.log(`\n📊 Найдено ${weeklyKeys.length} еженедельных записей:`);
  
  for (const key of weeklyKeys) {
    const data = await client.get(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`  ${key}: ${parsed.query} - ${parsed.changeType} (${parsed.oldPrice} → ${parsed.newPrice})`);
    }
  }

  await client.disconnect();
}

checkRedisData().catch(console.error); 