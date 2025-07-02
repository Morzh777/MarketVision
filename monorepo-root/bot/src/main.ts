import 'dotenv/config';

import TelegramBot from 'node-telegram-bot-api';
import { registerCommands } from './register-commands';
import { createServices } from './register-services';
import { DevUtils } from './utils/dev.utils';

const TOKEN = process.env.TG_BOT_TOKEN!;

if (!TOKEN) {
  console.error('❌ Не указан TG_BOT_TOKEN в переменных окружения');
  process.exit(1);
}

console.log('🤖 Запуск Telegram бота...');

if (DevUtils.isDev()) {
  console.log('🔧 Dev режим активен');
  DevUtils.log('Инициализация бота в dev режиме');
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Устанавливаем меню команд (только для админа)
bot.setMyCommands([
  { command: 'admin', description: '🔧 Админ панель' },
  { command: 'admin_start', description: '🚀 Запустить бота' },
  { command: 'admin_stop', description: '⏹️ Остановить бота' },
  { command: 'admin_pause', description: '⏸️ Приостановить постинг' },
  { command: 'admin_resume', description: '▶️ Возобновить постинг' },
  { command: 'admin_status', description: '📊 Статус работы' },
  { command: 'admin_test', description: '🧪 Тестовый парсинг' },
  { command: 'admin_clear', description: '🗑️ Очистить очередь' }
]);

// Создаем сервисы
const services = createServices();

// Регистрируем команды
registerCommands(bot, services);

// Dev логирование
if (DevUtils.isDev()) {
  // Проверка здоровья сервисов при запуске
  setTimeout(() => {
    DevUtils.checkServicesHealth();
  }, 2000);
  
  // Логирование событий бота
  bot.on('polling_error', (error) => {
    DevUtils.error('Polling error', error);
  });
  
  bot.on('webhook_error', (error) => {
    DevUtils.error('Webhook error', error);
  });
}

console.log('🚀 Бот запущен и готов к работе!');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершаем работу...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершаем работу...');
  bot.stopPolling();
  process.exit(0);
}); 