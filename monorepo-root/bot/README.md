# 🤖 MarketVision Telegram Bot

Telegram-бот для мониторинга цен на компьютерные комплектующие с поддержкой Mini App.

## 🚀 Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm run build
npm start
```

## ⚙️ Конфигурация

Создайте `.env` файл:
```env
TG_BOT_TOKEN=your_telegram_bot_token_here
MINI_APP_URL=https://t.me/MarketVisionBot/app
NODE_ENV=development
```

## 📋 Команды

- `/start` - Запустить бота
- `/help` - Показать справку
- `/status` - Статус работы
- `/app` - Открыть MarketVision Mini App

## 📱 Mini App

Бот поддерживает открытие MarketVision Mini App через специальную кнопку. При использовании команды `/app` пользователь получит сообщение с кнопкой для открытия веб-приложения прямо в Telegram.

## 🏗️ Архитектура

Telegram бот с:
- Базовыми командами
- Поддержкой Mini App
- Inline кнопками
- Обработкой ошибок
- Graceful shutdown
- Логированием

## 🔧 Технологии

- TypeScript + Node.js
- node-telegram-bot-api
- dotenv для конфигурации
- Telegram Bot API