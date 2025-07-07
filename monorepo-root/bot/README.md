# 🤖 Telegram Bot для WBInfo

Telegram-бот для мониторинга цен на компьютерные комплектующие и игровые консоли с интеграцией WildBerries и Ozon.

## 🚀 Особенности

- 📦 **Автоматический парсинг** товаров (видеокарты, процессоры, материнские платы, игровые консоли)
- 💰 **Отслеживание изменений цен** и скидок в реальном времени
- 📸 **Генерация красивых изображений** с кастомным шаблоном
- 🎨 **Умные интервалы постинга** в зависимости от размера скидки
- 👤 **Админ-панель** для управления ботом
- 🔒 **Приватный режим** (только для администратора)
- 🔄 **Интеграция с Product-Filter-Service** через HTTP API

## 🏗️ Архитектура

```
Bot (Telegram) → Product-Filter-Service (HTTP API) → WB-API + Ozon-API (gRPC)
```

### Основные компоненты:
- **SchedulerService** - Планировщик парсинга и постинга
- **PostQueueService** - Очередь постов с приоритетами
- **TemplateImageGeneratorService** - Генерация изображений с шаблоном
- **CategoryServices** - Сервисы для каждой категории товаров

## 📦 Установка и запуск

### 1. Установка зависимостей
```bash
cd monorepo-root/bot
npm install
```

### 2. Настройка окружения
Создайте файл `.env` в корне проекта:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
ADMIN_USER_ID=69884361
PRODUCT_FILTER_SERVICE_URL=http://localhost:3001
CHANNEL_URL=https://t.me/your_channel_username
```

### 3. Запуск
```bash
# Режим разработки
npm run dev

# Продакшн режим
npm run build
npm run start:prod
```

## 🎨 Генератор изображений

Бот использует кастомный шаблон для создания красивых изображений товаров.

### Настройка шаблона:
1. Создайте изображение-шаблон размером **1200x1200 пикселей**
2. Сохраните как `template.png` в папке `media/`
3. Бот автоматически будет использовать ваш шаблон

### Автоматически добавляется:
- ✅ Фото товара (в центре шаблона)
- ✅ Название товара
- ✅ Старая и новая цена
- ✅ Процент скидки
- ✅ Теги: "ХОРОШАЯ ЦЕНА" (5-10%), "МЕГА СКИДКА" (>10%)
- ✅ Категория товара

## 📋 Команды администратора

- `/start` - Запустить парсинг и постинг
- `/stop` - Остановить бота
- `/pause` - Приостановить постинг
- `/resume` - Возобновить постинг
- `/status` - Статус бота
- `/clear` - Очистить очередь
- `/test` - Тестовый парсинг

## 🔧 Технологический стек

- **Framework**: TypeScript + Node.js
- **Telegram API**: node-telegram-bot-api
- **HTTP Client**: node-fetch
- **Image Processing**: Sharp
- **Development**: nodemon, ts-node

## 📁 Структура проекта

```
src/
├── main.ts                           # Точка входа
├── register-commands.ts              # Регистрация команд
├── register-services.ts              # Регистрация сервисов
├── api/
│   └── wb-api.client.ts             # HTTP клиент для Product-Filter-Service
├── commands/
│   ├── admin.command.ts             # Админ команды
│   └── dev.command.ts               # Команды разработки
├── services/
│   ├── base.service.ts              # Базовый сервис
│   ├── scheduler.service.ts         # Планировщик
│   ├── post-queue.service.ts        # Очередь постов
│   ├── template-image-generator-sharp.service.ts # Генератор изображений
│   ├── videocards.service.ts        # Сервис видеокарт
│   ├── processors.service.ts        # Сервис процессоров
│   └── motherboards.service.ts      # Сервис материнских плат
├── utils/
│   ├── dev.utils.ts                 # Утилиты разработки
│   └── markdown.utils.ts            # Утилиты форматирования
└── media/                           # Медиа файлы и шаблоны
```

## 🔄 Интеграция с Product-Filter-Service

Бот взаимодействует с Product-Filter-Service через HTTP API:

```typescript
// Пример запроса к Product-Filter-Service
const response = await fetch(`${PRODUCT_FILTER_SERVICE_URL}/products/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'videocards',
    queries: ['rtx 5070', 'rtx 5080', 'rtx 5090']
  })
});
```

## 🧪 Тестирование

```bash
# Запуск в режиме отладки
npm run dev:debug

# Проверка статуса
curl http://localhost:3001/health
```

## 📊 Мониторинг

- **Логи**: Все логи пишутся в консоль
- **Статус**: Команда `/status` показывает текущее состояние
- **Метрики**: Время обработки, количество постов, ошибки

## 🚨 Частые проблемы

### Бот не отвечает
1. Проверьте `TELEGRAM_BOT_TOKEN` в `.env`
2. Убедитесь что Product-Filter-Service запущен
3. Проверьте логи на ошибки

### Изображения не генерируются
1. Установите Sharp: `npm install sharp`
2. Проверьте наличие `media/template.png`
3. Убедитесь что есть права на запись

### Нет новых постов
1. Проверьте что парсинг запущен: `/start`
2. Убедитесь что Product-Filter-Service возвращает данные
3. Проверьте настройки фильтрации

---

**Telegram Bot** - умный интерфейс для мониторинга цен на компьютерные комплектующие! 🚀