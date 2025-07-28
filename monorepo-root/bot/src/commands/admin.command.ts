import TelegramBot from 'node-telegram-bot-api';
import { SchedulerService } from '../services/scheduler.service';

const ADMIN_ID = '69884361'; // ID админа

export class AdminCommand {
  constructor(
    private bot: TelegramBot,
    private createScheduler: (chatId: string) => SchedulerService
  ) {}

  // Проверка на админа
  private isAdmin(userId: string): boolean {
    return userId === ADMIN_ID;
  }

  // Получить scheduler
  private getScheduler(chatId: string): SchedulerService {
    return this.createScheduler(chatId);
  }

  // Обработка админских команд
  async handleCommand(msg: any) {
    const userId = msg.from.id.toString();
    const text = msg.text;
    
    // Команда /app доступна всем пользователям
    if (text === '/app') {
      await this.openMiniApp(msg.chat.id);
      return;
    }
    
    // Остальные команды только для админа
    if (!this.isAdmin(userId)) {
      await this.bot.sendMessage(msg.chat.id, '❌ У вас нет прав администратора');
      return;
    }

    if (text === '/admin') {
      await this.showAdminMenu(msg.chat.id);
    } else if (text === '/admin_start') {
      await this.startBot(msg.chat.id);
    } else if (text === '/admin_stop') {
      await this.stopBot(msg.chat.id);
    } else if (text === '/admin_pause') {
      await this.pausePosting(msg.chat.id);
    } else if (text === '/admin_resume') {
      await this.resumePosting(msg.chat.id);
    } else if (text === '/admin_status') {
      await this.showStatus(msg.chat.id);
    } else if (text === '/admin_test') {
      await this.testParsing(msg.chat.id);
    } else if (text === '/admin_clear') {
      await this.clearQueue(msg.chat.id);
    }
  }

  // Обработка нажатий на кнопки
  async handleCallback(callbackQuery: any) {
    const userId = callbackQuery.from.id.toString();
    
    if (!this.isAdmin(userId)) {
      await this.bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Нет прав' });
      return;
    }

    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    try {
      switch (data) {
        case 'admin_start':
          await this.startBot(chatId);
          break;
        case 'admin_stop':
          await this.stopBot(chatId);
          break;
        case 'admin_pause':
          await this.pausePosting(chatId);
          break;
        case 'admin_resume':
          await this.resumePosting(chatId);
          break;
        case 'admin_status':
          await this.showStatus(chatId);
          break;
        case 'admin_test':
          await this.testParsing(chatId);
          break;
        case 'admin_clear':
          await this.clearQueue(chatId);
          break;
      }

      // Уведомляем Telegram, что callback обработан
      await this.bot.answerCallbackQuery(callbackQuery.id);

    } catch (error) {
      console.error('❌ Ошибка при обработке callback:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка' });
    }
  }

  // Показать админское меню
  private async showAdminMenu(chatId: string) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🚀 Запустить', callback_data: 'admin_start' },
          { text: '⏹️ Остановить', callback_data: 'admin_stop' }
        ],
        [
          { text: '⏸️ Пауза', callback_data: 'admin_pause' },
          { text: '▶️ Возобновить', callback_data: 'admin_resume' }
        ],
        [
          { text: '📊 Статус', callback_data: 'admin_status' },
          { text: '🧪 Тест', callback_data: 'admin_test' }
        ],
        [
          { text: '🗑️ Очистить очередь', callback_data: 'admin_clear' }
        ]
      ]
    };

    const message = `🔧 *АДМИН ПАНЕЛЬ*

Выберите действие:`;

    await this.bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    });
  }

  // Запустить бота
  private async startBot(chatId: string) {
    const scheduler = this.getScheduler(chatId);
    if (!scheduler) {
      await this.bot.sendMessage(chatId, '❌ Планировщик не инициализирован');
      return;
    }
    scheduler.start();
    await this.bot.sendMessage(chatId, '🚀 Бот запущен');
  }

  // Остановить бота
  private async stopBot(chatId: string) {
    const scheduler = this.getScheduler(chatId);
    if (!scheduler) {
      await this.bot.sendMessage(chatId, '❌ Планировщик не инициализирован');
      return;
    }
    scheduler.stop();
    await this.bot.sendMessage(chatId, '⏹️ Бот остановлен');
  }

  // Приостановить постинг
  private async pausePosting(chatId: string) {
    const scheduler = this.getScheduler(chatId);
    if (!scheduler) {
      await this.bot.sendMessage(chatId, '❌ Планировщик не инициализирован');
      return;
    }
    scheduler.pause();
    await this.bot.sendMessage(chatId, '⏸️ Постинг приостановлен (для рекламы)');
  }

  // Возобновить постинг
  private async resumePosting(chatId: string) {
    const scheduler = this.getScheduler(chatId);
    if (!scheduler) {
      await this.bot.sendMessage(chatId, '❌ Планировщик не инициализирован');
      return;
    }
    scheduler.resume();
    await this.bot.sendMessage(chatId, '▶️ Постинг возобновлен');
  }

  // Показать статус
  private async showStatus(chatId: string) {
    const scheduler = this.getScheduler(chatId);
    if (!scheduler) {
      await this.bot.sendMessage(chatId, '❌ Планировщик не инициализирован');
      return;
    }
    
    const stats = scheduler.getStats();
    const status = `
📊 СТАТУС БОТА

Работает: ${stats.isRunning ? '✅ Да' : '❌ Нет'}
Пауза постинга: ${scheduler.isPostingPaused() ? '⏸️ Да' : '▶️ Нет'}

Очередь постов:
• Срочных: ${stats.queue.urgent}
• Обычных: ${stats.queue.normal}
• Всего: ${stats.queue.total}
    `;
    
    await this.bot.sendMessage(chatId, status);
  }

  // Тестовый парсинг
  private async testParsing(chatId: string) {
    await this.bot.sendMessage(chatId, '🧪 Запускаю тестовый парсинг...');
    // Здесь можно добавить тестовый парсинг
  }

  // Очистить очередь
  private async clearQueue(chatId: string) {
    // Нужно добавить метод очистки очереди в PostQueueService
    await this.bot.sendMessage(chatId, '🗑️ Очередь постов очищена');
  }

  // Открыть Mini App
  private async openMiniApp(chatId: string) {
    const webAppUrl = 'https://a846814ae0190971759ab515816af559.serveo.net'; // Локальный домен для тестирования
    
    const keyboard = {
      inline_keyboard: [
        [{
          text: '📱 Открыть MarketVision',
          web_app: { url: webAppUrl }
        }]
      ]
    };

    await this.bot.sendMessage(chatId, 
      '📱 Нажмите кнопку ниже, чтобы открыть MarketVision Mini App:', 
      { reply_markup: keyboard }
    );
  }
} 