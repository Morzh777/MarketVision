export interface Post {
  id: string;
  stableId: string;
  category: 'videocards' | 'processors' | 'motherboards' | 'ram';
  title: string;
  brand: string;
  supplier: string;
  price: number;
  previousPrice?: number;
  discount?: number;
  photoUrl?: string;
  productUrl: string;
  priority: 'normal' | 'urgent';
  createdAt: Date;
}

export class PostQueueService {
  private queue: Post[] = [];
  private currentIndex = 0;
  private readonly categories = ['videocards', 'processors'];

  // Добавить обычный пост в очередь
  addToQueue(post: Post) {
    this.queue.push(post);
    console.log(`📝 Добавлен пост в очередь: ${post.category} - ${post.title}`);
  }

  // Добавить срочный пост (скидка) в начало очереди
  addUrgentPost(post: Post) {
    this.queue.unshift(post);
    
    let priceInfo = '';
    if (!post.previousPrice) {
      priceInfo = `🆕 Новый товар`;
    } else if (post.discount && post.discount >= 10) {
      priceInfo = `🔥🔥 Большая скидка ${post.discount}%`;
    } else if (post.discount && post.discount >= 5) {
      priceInfo = `🔥 Хорошая скидка ${post.discount}%`;
    } else if (post.previousPrice > post.price) {
      const savings = post.previousPrice - post.price;
      priceInfo = `📉 Дешевле на ${savings.toLocaleString('ru-RU')} ₽`;
    } else {
      priceInfo = `💰 ${post.price.toLocaleString('ru-RU')} ₽`;
    }
    
    console.log(`🚨 СРОЧНЫЙ пост: ${post.category} - ${post.title} (${priceInfo})`);
  }

  // Получить следующий пост из очереди
  getNextPost(): Post | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift()!;
  }

  // Перемешать посты в очереди для разнообразия категорий
  shuffleQueue() {
    if (this.queue.length <= 1) return;
    
    console.log(`🔀 Перемешиваем ${this.queue.length} постов в очереди...`);
    
    // Сначала разделяем на срочные и обычные
    const urgentPosts = this.queue.filter(p => p.priority === 'urgent');
    const normalPosts = this.queue.filter(p => p.priority === 'normal');
    
    // Перемешиваем обычные посты
    for (let i = normalPosts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normalPosts[i], normalPosts[j]] = [normalPosts[j], normalPosts[i]];
    }
    
    // Собираем обратно: сначала срочные, потом перемешанные обычные
    this.queue = [...urgentPosts, ...normalPosts];
    
    console.log(`✅ Очередь перемешана: ${urgentPosts.length} срочных, ${normalPosts.length} обычных`);
  }

  // Получить количество постов в очереди
  getQueueLength(): number {
    return this.queue.length;
  }

  // Получить статистику очереди
  getQueueStats() {
    const urgent = this.queue.filter(p => p.priority === 'urgent').length;
    const normal = this.queue.filter(p => p.priority === 'normal').length;
    return { urgent, normal, total: this.queue.length };
  }

  // Проверить, есть ли скидка
  isGoodDeal(currentPrice: number, previousPrice: number): boolean {
    if (!previousPrice) return false;
    const discount = ((previousPrice - currentPrice) / previousPrice) * 100;
    return discount >= 5; // Скидка 5% или больше
  }

  // Создать пост из данных API
  createPost(category: any, result: any, previousPrice: any, discount: any): Post {
    const price = result.price;
    // 🔗 Используем готовую ссылку от сервиса
    const url = result.productUrl || `https://www.wildberries.ru/catalog/${result.id}/detail.aspx`;
    
    // 🖼️ Исправляем URL изображения
    let photoUrl = result.photoUrl;
    if (photoUrl) {
      // Проверяем, не URL-encoded ли уже URL
      try {
        const decodedUrl = decodeURIComponent(photoUrl);
        if (decodedUrl !== photoUrl) {
          console.log(`🔧 Исправляем URL изображения: ${photoUrl} → ${decodedUrl}`);
          photoUrl = decodedUrl;
        }
      } catch (error) {
        console.warn(`⚠️ Не удалось декодировать URL изображения: ${photoUrl}`);
      }
    }
    
    // Используем скидку из WB API, если она есть, иначе вычисляем
    const finalDiscount = discount !== undefined ? discount : 
      (previousPrice ? ((previousPrice - price) / previousPrice) * 100 : 0);
    
    // 🎯 Улучшенная логика приоритета
    let isUrgent = false;
    let priorityReason = '';
    
    if (!previousPrice) {
      isUrgent = true;
      priorityReason = 'новый товар';
    } else if (finalDiscount >= 10) {
      isUrgent = true;
      priorityReason = `большая скидка ${Math.round(finalDiscount)}%`;
    } else if (finalDiscount >= 5) {
      isUrgent = true;
      priorityReason = `хорошая скидка ${Math.round(finalDiscount)}%`;
    } else if (finalDiscount > 0) {
      priorityReason = `небольшая скидка ${Math.round(finalDiscount)}%`;
    } else {
      priorityReason = 'без изменений цены';
    }

    return {
      id: result.id,
      stableId: result.stableId,
      category,
      title: result.name,
      brand: result.brand,
      supplier: result.supplier,
      price,
      previousPrice,
      discount: finalDiscount !== undefined && finalDiscount > 0 ? Math.round(finalDiscount) : 0,
      photoUrl,
      productUrl: url,
      priority: isUrgent ? 'urgent' : 'normal',
      createdAt: new Date()
    };
  }

  // Получить интервал постинга в зависимости от приоритета
  getPostingInterval(post: Post): number {
    if (!post.previousPrice) {
      // Новинка - 2 минуты
      return 2 * 60 * 1000;
    }
    
    const discount = post.discount || 0;
    
    if (discount >= 10) {
      // Большая скидка - 2 минуты
      return 2 * 60 * 1000;
    } else if (discount >= 5) {
      // Средняя скидка - 5 минут
      return 5 * 60 * 1000;
    } else {
      // Мелкая скидка - 10 минут
      return 10 * 60 * 1000;
    }
  }
} 