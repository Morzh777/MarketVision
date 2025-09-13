import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

const TOKEN = "8055367223:AAFWLKg1wwRwwn81jSVzq9OuKMS1qxo0rtM";
// URL мини-приложения (Next.js UI)
const WEB_APP_URL = "https://marketvision.loca.lt";
// Прокси через Nginx внутри docker-сети (порт 8080 для внутренних запросов)
const GATEWAY_URL = 'http://marketvision-nginx-proxy:8080';

if (!TOKEN) {
  console.error('❌ Не указан TG_BOT_TOKEN в переменных окружения');
  process.exit(1);
}

if (!WEB_APP_URL) {
  console.error('❌ Не указан WEB_APP_URL в переменных окружения');
  process.exit(1);
}

console.log('🤖 Запуск Telegram бота...');
console.log('🔗 WEB_APP_URL:', WEB_APP_URL);

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
  
  // Логируем информацию о пользователе
  if (msg.from) {
    console.log('💾 Пользователь запускает приложение:', {
      telegram_id: msg.from.id,
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });
    
    // Отправляем запрос на сохранение пользователя
    saveTelegramUser(msg.from);
    
    // Создаем URL миниаппа с telegram_id
    const miniAppUrl = `${WEB_APP_URL}?telegram_id=${msg.from.id}`;
    console.log('🔗 Создаем URL миниаппа:', {
      WEB_APP_URL,
      telegram_id: msg.from.id,
      finalUrl: miniAppUrl
    });
    
    // Создаем inline keyboard с кнопкой для открытия приложения
    const keyboard = {
      inline_keyboard: [
        [{
          text: '🚀 Запустить MarketVision',
          web_app: {
            url: miniAppUrl
          }
        }]
      ]
    };
    
    bot.sendMessage(chatId, 
      '🚀 Нажмите кнопку ниже, чтобы запустить MarketVision:',
      { reply_markup: keyboard }
    );
  }
});

// Функция сохранения telegram пользователя
async function saveTelegramUser(from: TelegramBot.User) {
  try {
    const userData = {
      telegram_id: from.id.toString()
    };

    console.log('💾 Отправляем данные пользователя в API:', userData);

    // Отправляем запрос через Nginx (внутренняя сеть)
    const url = `${GATEWAY_URL.replace(/\/$/, '')}/api/auth/telegram`;
    console.log('🌐 Отправляем запрос на сохранение пользователя:', {
      GATEWAY_URL,
      finalUrl: url,
      userData
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Пользователь сохранен через gateway:', result);
    } else {
      const errText = await response.text().catch(() => '');
      console.error('❌ Ошибка сохранения пользователя через gateway:', url, response.status, response.statusText, errText);
    }
  } catch (error) {
    console.error('❌ Ошибка при сохранении пользователя:', error);
  }
}

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