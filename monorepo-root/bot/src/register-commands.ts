import TelegramBot from 'node-telegram-bot-api';
import { devCommand } from './commands/dev.command';
import { AdminCommand } from './commands/admin.command';
import { createScheduler } from './register-services';
import { DevUtils } from './utils/dev.utils';
// import { cpusCommand } from './commands/cpus.command'; // пример для будущих категорий

// Можно расширять по мере добавления сервисов
interface Services {
  postQueue: any;
  videocards: any;
  processors: any;
  motherboards: any;
}

let scheduler: any = null;

export function registerCommands(bot: TelegramBot, services: Services) {
  // Функция для создания scheduler
  const createSchedulerForAdmin = (chatId: string) => {
    if (!scheduler) {
      scheduler = createScheduler(bot, chatId, services);
    }
    return scheduler;
  };

  // Создаем экземпляр админских команд
  const adminCommand = new AdminCommand(bot, createSchedulerForAdmin);
  
  // Dev команды (только в dev режиме)
  if (DevUtils.isDev()) {
    devCommand(bot, services);
    console.log('🔧 Dev команды зарегистрированы');
  }
  
  // 🎯 Админские команды
  bot.onText(/\/admin(_\w+)?/, async (msg) => {
    await adminCommand.handleCommand(msg);
  });

  // 🎯 Команда для открытия Mini App (доступна всем)
  bot.onText(/\/app/, async (msg) => {
    await adminCommand.handleCommand(msg);
  });

  // 🎯 Обработка нажатий на админские кнопки
  bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    
    // Проверяем, что это админский callback
    if (data && data.startsWith('admin_')) {
      await adminCommand.handleCallback(callbackQuery);
    }
  });

  // 🚫 ИГНОРИРУЕМ все остальные команды и сообщения
  bot.onText(/\/.*/, async (msg) => {
    // Проверяем, не админ ли это
    if (!msg.from) return;
    const userId = msg.from.id.toString();
    if (userId === '69884361') {
      // Админ может использовать любые команды
      return;
    }
    
    // Для всех остальных - игнорируем
    console.log(`🚫 Игнорируем команду от пользователя ${userId}: ${msg.text}`);
  });

  // 🚫 ИГНОРИРУЕМ все текстовые сообщения
  bot.on('message', async (msg) => {
    // Проверяем, не админ ли это
    if (!msg.from) return;
    const userId = msg.from.id.toString();
    if (userId === '69884361') {
      // Админ может отправлять сообщения
      return;
    }
    
    // Для всех остальных - игнорируем
    if (msg.text && !msg.text.startsWith('/')) {
      console.log(`🚫 Игнорируем сообщение от пользователя ${userId}: ${msg.text}`);
    }
  });
} 