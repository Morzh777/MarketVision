import { PostQueueService, Post } from './post-queue.service';
import { VideocardsService } from './videocards.service';
import { ProcessorsService } from './processors.service';
import { MotherboardsService } from './motherboards.service';
import { TemplateImageGeneratorSharpService } from './template-image-generator-sharp.service';
import * as TelegramBot from 'node-telegram-bot-api';
import process from 'process';

export class SchedulerService {
  private isRunning = false;
  private isPaused = false; // 🎯 Новое состояние паузы
  private imageGenerator: TemplateImageGeneratorSharpService;

  constructor(
    private postQueue: PostQueueService,
    private videocardsService: VideocardsService,
    private processorsService: ProcessorsService,
    private motherboardsService: MotherboardsService,
    private bot: TelegramBot,
    private chatId: string
  ) {
    this.imageGenerator = new TemplateImageGeneratorSharpService();
    console.log('🗓️ Планировщик создан');
    // Product-Filter-Service теперь обрабатывает всю логику истории
  }

  // Запустить планировщик
  start() {
    if (this.isRunning) {
      console.log('⚠️ Планировщик уже запущен');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Планировщик запущен');

    // Keep-alive каждые 10 минут
    setInterval(() => {
      this.keepAlive();
    }, 10 * 60 * 1000);

    // 🚀 НОВАЯ ЛОГИКА: Парсинг каждый час, постинг сразу после находок
    this.scheduleContinuousParsing();
  }

  // Остановить планировщик
  stop() {
    this.isRunning = false;
    console.log('⏹️ Планировщик остановлен');
  }

  // 🎯 Пауза постинга (для рекламы)
  pause() {
    this.isPaused = true;
    console.log('⏸️ Постинг приостановлен');
  }

  // 🎯 Возобновить постинг
  resume() {
    this.isPaused = false;
    console.log('▶️ Постинг возобновлен');
  }

  // 🎯 Проверить состояние паузы
  isPostingPaused(): boolean {
    return this.isPaused;
  }

  // 🚀 НОВЫЙ МЕТОД: Непрерывный парсинг каждый час
  private scheduleContinuousParsing() {
    console.log('🔄 Запускаем парсинг каждый час');
    
    // Сразу запускаем первый цикл
    this.parseAllCategories();
    
    // Затем каждый час
    setInterval(() => {
      this.parseAllCategories();
    }, 60 * 60 * 1000); // 60 минут
  }

  // Универсальный парсер категории
  private async parseCategory(service: any, method: string, category: string, logName: string) {
    try {
      console.log(`🔍 Парсинг ${logName}...`);
      const results = await service[method]();
      let added = 0, urgent = 0, skipped = 0, priceIncreased = 0;
      const total = results.length, barLength = 20;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        // Product-Filter-Service уже отфильтровал товары по истории
        
        // 🚫 НЕ добавляем товары с ростом цен (пользователю это не интересно)
        if (result.previousPrice && result.previousPrice < result.price) {
          priceIncreased++;
          console.log(`📈 Пропускаем (рост цены): ${result.name} - было ${result.previousPrice}₽ → стало ${result.price}₽`);
          continue;
        }
        
        const post = this.postQueue.createPost(category, result, result.previousPrice, result.discount);
        if (post.priority === 'urgent') { this.postQueue.addUrgentPost(post); urgent++; added++; }
        else if (post.priority === 'normal') { this.postQueue.addToQueue(post); added++; }
        
        // Прогресс-бар
        const progress = Math.round(((i + 1) / total) * barLength);
        const bar = '[' + '#'.repeat(progress) + '-'.repeat(barLength - progress) + `] ${i + 1}/${total}`;
        process.stdout.write(`\r${bar}`);
      }
      process.stdout.write('\n');
      console.log(`✅ ${logName}: найдено ${total}, добавлено ${added} (срочных: ${urgent}), пропущено ${skipped}, рост цен ${priceIncreased}`);
      
      // 🚀 СРАЗУ отправляем посты после парсинга категории
      if (added > 0) {
        console.log(`📤 Отправляем ${added} постов для ${logName}...`);
        await this.sendAllPosts();
      }
    } catch (error) {
      console.error(`❌ Ошибка парсинга ${logName}:`, error);
    }
  }

  // Парсинг всех категорий с интервалами
  private async parseAllCategories() {
    console.log('🔍 Начинаем парсинг всех категорий...');
    try {
      await this.parseCategory(this.videocardsService, 'getProducts', 'videocards', 'видеокарт');
      await this.parseCategory(this.processorsService, 'getProducts', 'processors', 'процессоров');
      await this.parseCategory(this.motherboardsService, 'getProducts', 'motherboards', 'материнских плат');
      console.log('✅ Парсинг всех категорий завершен');
    } catch (error) {
      console.error('❌ Ошибка парсинга категорий:', error);
    }
  }

  // Отправить все посты из очереди (при запуске)
  private async sendAllPosts() {
    try {
      console.log('🎯 Отправляем все посты из очереди...');
      
      let sentCount = 0;
      while (true) {
        // 🎯 Проверяем паузу перед каждым постом
        if (this.isPaused) {
          console.log('⏸️ Постинг приостановлен, ждем возобновления...');
          await new Promise(resolve => setTimeout(resolve, 30 * 1000)); // Проверяем каждые 30 секунд
          continue;
        }

        const post = this.postQueue.getNextPost();
        if (!post) {
          console.log('📭 Очередь постов пуста');
          break;
        }

        // Product-Filter-Service уже проверил историю

        console.log(`📤 Отправляем пост: ${post.category} - ${post.title}`);
        
        const message = this.formatPostMessage(post);
        const options: any = { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Поделиться', switch_inline_query: post.title }
              ],
              [
                { text: '🛒 Ссылка на товар', url: post.productUrl }
              ]
            ]
          }
        };
        
        // 🎨 Генерируем красивое изображение
        console.log(`📤 Подготовка поста: ${post.title}`);
        console.log(`📷 PhotoUrl: ${post.photoUrl || 'отсутствует'}`);
        console.log(`🏪 Поставщик: ${post.supplier || 'не указан'}`);
        
        try {
          const imageBuffer = await this.imageGenerator.generateProductImage({
            title: post.title,
            brand: post.brand,
            supplier: post.supplier,
            price: post.price,
            previousPrice: post.previousPrice,
            discount: post.discount,
            imageUrl: post.photoUrl,
            category: post.category
          });

          // Отправляем сгенерированное изображение
          options.caption = message;
          await this.bot.sendPhoto(this.chatId, imageBuffer, { 
            ...options,
            filename: 'product-image.png'
          });
          console.log(`✅ Отправлен пост с красивым изображением: ${post.title}`);
        } catch (imageError: any) {
          console.warn(`⚠️ Не удалось сгенерировать изображение для ${post.title}:`, imageError.message);
          
          // Fallback: пробуем отправить оригинальное фото если есть
          if (post.photoUrl) {
            try {
              options.caption = message;
              await this.bot.sendPhoto(this.chatId, post.photoUrl, options);
            } catch (photoError: any) {
              console.warn(`⚠️ Не удалось отправить фото для ${post.title}:`, photoError.message);
              console.log(`📤 Отправляем текстовое сообщение без фото`);
              // Fallback: отправляем текстовое сообщение без фото
              await this.bot.sendMessage(this.chatId, message, options);
            }
          } else {
            await this.bot.sendMessage(this.chatId, message, options);
          }
        }

        // Product-Filter-Service сам управляет историей публикаций

        sentCount++;
        
        // 🎯 Умный интервал постинга в зависимости от приоритета
        const interval = this.postQueue.getPostingInterval(post);
        const intervalMinutes = Math.round(interval / (60 * 1000));
        console.log(`⏰ Следующий пост через ${intervalMinutes} минут (приоритет: ${post.priority})`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      console.log(`✅ Отправлено постов: ${sentCount}`);
    } catch (error) {
      console.error('❌ Ошибка отправки постов:', error);
    }
  }

  // Отправить следующий пост (регулярный постинг)
  private async sendNextPost() {
    try {
      const post = this.postQueue.getNextPost();
      if (!post) {
        console.log('📭 Очередь постов пуста');
        return;
      }

      // Product-Filter-Service уже проверил историю

      console.log(`📤 Отправляем пост: ${post.category} - ${post.title}`);
      
      const message = this.formatPostMessage(post);
      const options: any = { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Поделиться', switch_inline_query: post.title }
            ],
            [
              { text: '🛒 Ссылка на товар', url: post.productUrl }
            ]
          ]
        }
      };
      
      // 🎨 Генерируем красивое изображение
      console.log(`📤 Подготовка поста: ${post.title}`);
      console.log(`📷 PhotoUrl: ${post.photoUrl || 'отсутствует'}`);
      console.log(`🏪 Поставщик: ${post.supplier || 'не указан'}`);
      
      try {
        const imageBuffer = await this.imageGenerator.generateProductImage({
          title: post.title,
          brand: post.brand,
          supplier: post.supplier,
          price: post.price,
          previousPrice: post.previousPrice,
          discount: post.discount,
          imageUrl: post.photoUrl,
          category: post.category
        });

        // Отправляем сгенерированное изображение
        options.caption = message;
        await this.bot.sendPhoto(this.chatId, imageBuffer, { 
          ...options,
          filename: 'product-image.png'
        });
        console.log(`✅ Отправлен пост с красивым изображением: ${post.title}`);
      } catch (imageError: any) {
        console.warn(`⚠️ Не удалось сгенерировать изображение для ${post.title}:`, imageError.message);
        
        // Fallback: пробуем отправить оригинальное фото если есть
        if (post.photoUrl) {
          try {
            options.caption = message;
            await this.bot.sendPhoto(this.chatId, post.photoUrl, options);
          } catch (photoError: any) {
            console.warn(`⚠️ Не удалось отправить фото для ${post.title}:`, photoError.message);
            console.log(`📤 Отправляем текстовое сообщение без фото`);
            // Fallback: отправляем текстовое сообщение без фото
            await this.bot.sendMessage(this.chatId, message, options);
          }
        } else {
          await this.bot.sendMessage(this.chatId, message, options);
        }
      }

      // Product-Filter-Service сам управляет историей публикаций

      console.log(`✅ Пост отправлен: ${post.title}`);
    } catch (error) {
      console.error('❌ Ошибка отправки поста:', error);
    }
  }

  // Форматирование сообщения для поста
  private formatPostMessage(post: Post): string {
    const title = post.title;
    const brand = post.brand;
    const supplier = post.supplier;
    const channelUrl = process.env.CHANNEL_URL || 'https://t.me/your_channel_username';

    const categoryMap: Record<string, string> = {
      videocards: 'Видеокарта',
      processors: 'Процессор',
      motherboards: 'Материнская плата',
      ram: 'Оперативная память',
    };
    const categoryName = categoryMap[post.category] || 'Товар';
    
    let priceString = '';
    const newPrice = `*${post.price.toLocaleString('ru-RU')} ₽*`;

    if (post.previousPrice && post.previousPrice > post.price) {
      const oldPrice = `~~${post.previousPrice.toLocaleString('ru-RU')} ₽~~`;
      const savings = post.previousPrice - post.price;
      const discountPercent = post.discount !== undefined && post.discount > 0 ? post.discount : 
        Math.round(((post.previousPrice - post.price) / post.previousPrice) * 100);
      
      // 🔥 Делаем скидки более заметными - новый прайс впереди, старый зачеркнутый сзади
      if (discountPercent >= 10) {
        priceString = `📉 ${newPrice} → ${oldPrice} (*-${discountPercent}%*, экономия *${savings.toLocaleString('ru-RU')} ₽*)`;
      } else if (discountPercent >= 5) {
        priceString = `📉 ${newPrice} → ${oldPrice} (*-${discountPercent}%*, экономия *${savings.toLocaleString('ru-RU')} ₽*)`;
      } else {
        priceString = `📉 ${newPrice} → ${oldPrice} (экономия *${savings.toLocaleString('ru-RU')} ₽*)`;
      }
    } else if (!post.previousPrice) {
      // Новый товар - убираем (Новинка)
      priceString = `${newPrice}`;
    } else {
      priceString = newPrice;
    }
    
    let message = `🔥 *${title}*\n`;
    if (brand && brand.toLowerCase() !== 'unknown') {
      message += `*Производитель:* ${brand}\n\n`;
    }
    if (supplier && supplier.trim() !== '') {
      message += `🏪 *Магазин:* ${supplier}\n\n`;
    }
    message += `💰 *Цена:* ${priceString}\n\n`;
    message += `📢 [Подписаться на канал](${channelUrl})`;
    
    return message;
  }

  // Получить статистику
  getStats() {
    const queueStats = this.postQueue.getQueueStats();
    return {
      isRunning: this.isRunning,
      queue: queueStats
    };
  }

  // Keep-alive функция
  private keepAlive() {
    const now = new Date().toLocaleString('ru-RU');
    console.log(`💓 Keep-alive: ${now} - Планировщик работает`);
  }
}