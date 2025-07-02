import TelegramBot from 'node-telegram-bot-api';
import { DevUtils } from '../utils/dev.utils';

export function devCommand(bot: TelegramBot, services: any) {
  // Команда /dev - только в dev режиме
  bot.onText(/\/dev/, async (msg) => {
    if (!DevUtils.isDev()) {
      await bot.sendMessage(msg.chat.id, '❌ Dev режим недоступен в продакшене');
      return;
    }

    const devMessage = `🔧 *Dev режим активен*

📊 *Доступные команды:*
• /dev\\_health - Проверка сервисов
• /dev\\_mock - Тестовые данные
• /dev\\_stats - Статистика бота
• /dev\\_restart - Перезапуск (rs)
• /dev\\_env - Переменные окружения

⚙️ *Режим:* ${process.env.NODE_ENV || 'development'}
🔍 *Dev Mode:* ${process.env.DEV_MODE || 'false'}`;

    await bot.sendMessage(msg.chat.id, devMessage, { parse_mode: 'Markdown' });
  });

  // Проверка здоровья сервисов
  bot.onText(/\/dev_health/, async (msg) => {
    if (!DevUtils.isDev()) return;

    await bot.sendMessage(msg.chat.id, '🏥 Проверяю сервисы...');
    
    try {
      await DevUtils.checkServicesHealth();
      await bot.sendMessage(msg.chat.id, '✅ Проверка завершена (см. консоль)');
    } catch (error) {
      await bot.sendMessage(msg.chat.id, `❌ Ошибка проверки: ${error}`);
    }
  });

  // Тестовые данные
  bot.onText(/\/dev_mock/, async (msg) => {
    if (!DevUtils.isDev()) return;

    const mockData = DevUtils.getMockProducts('videocards');
    let message = `🧪 *Тестовые данные:*\n\n`;
    
    mockData.forEach((product, index) => {
      message += `${index + 1}. *${product.name}*\n`;
      message += `💰 ${product.price.toLocaleString('ru-RU')} ₽\n`;
      message += `🏷️ ${product.brand}\n\n`;
    });

    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
  });

  // Статистика бота
  bot.onText(/\/dev_stats/, async (msg) => {
    if (!DevUtils.isDev()) return;

    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    };

    const message = `📊 *Статистика бота:*

⏱️ *Uptime:* ${Math.round(stats.uptime)}s
🧠 *Memory:* ${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB
🟢 *Node:* ${stats.nodeVersion}
💻 *Platform:* ${stats.platform}
🆔 *PID:* ${stats.pid}`;

    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
  });

  // Переменные окружения
  bot.onText(/\/dev_env/, async (msg) => {
    if (!DevUtils.isDev()) return;

    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DEV_MODE: process.env.DEV_MODE,
      TG_BOT_TOKEN: process.env.TG_BOT_TOKEN ? '***' : 'не задан',
      WB_API_URL: process.env.WB_API_URL || 'не задан'
    };

    const message = `🔧 *Переменные окружения:*

🌍 *NODE_ENV:* ${envVars.NODE_ENV}
🔍 *DEV_MODE:* ${envVars.DEV_MODE}
🤖 *TG_BOT_TOKEN:* ${envVars.TG_BOT_TOKEN}
🌐 *WB_API_URL:* ${envVars.WB_API_URL}`;

    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
  });

  // Перезапуск (для nodemon)
  bot.onText(/\/dev_restart/, async (msg) => {
    if (!DevUtils.isDev()) return;

    await bot.sendMessage(msg.chat.id, '🔄 Перезапускаю бота...');
    
    // Отправляем сигнал для nodemon
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });
} 