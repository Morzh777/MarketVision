import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const TOKEN = process.env.TG_BOT_TOKEN!;

if (!TOKEN) {
  console.error('❌ Не указан TG_BOT_TOKEN в переменных окружения');
  process.exit(1);
}

console.log('🤖 Запуск Telegram бота...');

const bot = new TelegramBot(TOKEN, { polling: true });

// Устанавливаем меню команд
bot.setMyCommands([
  { command: 'app', description: '🚀 Запустить MarketVision' }
]);

// Обработчик команды /reset для сброса меню
bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  
  // Устанавливаем новое меню (это перезапишет старое)
  bot.setMyCommands([
    { command: 'app', description: '🚀 Запустить MarketVision' }
  ]);
  
  bot.sendMessage(chatId, '🔄 Меню команд обновлено! Теперь доступна только команда /app');
});

// Обработчик команды /app для запуска приложения
bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  
  // Создаем inline keyboard с кнопкой для открытия приложения
  const keyboard = {
    inline_keyboard: [
      [{
        text: '🚀 Запустить MarketVision',
        web_app: {
          url: process.env.WEB_APP_URL || 'https://brave-feet-give.loca.lt'
        }
      }]
    ]
  };
  
  bot.sendMessage(chatId, 
    '🚀 Нажмите кнопку ниже, чтобы запустить MarketVision:',
    { reply_markup: keyboard }
  );
});

// Обработчик для web_app_data (когда пользователь нажимает на кнопку Mini App)
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  console.log('📱 Получены данные от Mini App:', msg.web_app_data);
  
  bot.sendMessage(chatId, 
    '✅ Mini App открыт! Теперь вы можете использовать MarketVision.'
  );
});

// Обработчик для callback_query (нажатия на inline кнопки)
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  const data = callbackQuery.data;
  
  if (chatId) {
    console.log('🔘 Нажата inline кнопка:', data);
    
    // Отвечаем на callback query
    bot.answerCallbackQuery(callbackQuery.id);
    
    if (data === 'open_app') {
      bot.sendMessage(chatId, '🚀 Открываю MarketVision...');
    }
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('❌ Webhook error:', error);
});

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