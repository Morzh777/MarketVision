# 🔧 Dev режим для Telegram бота

## 🏗️ Архитектура

```
Telegram Bot (Frontend) → Product-Filter-Service (Backend) → WB-API + Redis
```

Бот подключается **только** к Product-Filter-Service (порт 3001).

## 🚀 Быстрый запуск

```bash
# Установка зависимостей
npm install

# Запуск в dev режиме с hot reload
npm run dev

# Запуск с отладкой
npm run dev:debug
```

## ⚡ Hot Reload

Бот автоматически перезапускается при изменении файлов:
- `src/**/*.ts` - TypeScript файлы
- `src/**/*.js` - JavaScript файлы  
- `src/**/*.json` - Конфигурационные файлы

### 🔄 Ручной перезапуск
```bash
# В консоли где запущен бот
rs

# Или через Telegram команду (в dev режиме)
/dev_restart
```

## 🔍 Dev команды

### Основные команды:
- `/dev` - Меню dev режима
- `/dev_health` - Проверка Product-Filter-Service
- `/dev_mock` - Тестовые данные
- `/dev_stats` - Статистика бота
- `/dev_env` - Переменные окружения
- `/dev_restart` - Перезапуск бота

### Проверка сервисов:
```bash
# Product-Filter-Service (единственный сервис для бота)
curl http://localhost:3001/videocards

# Проверка через dev команду
/dev_health
```

## 📊 Логирование

### Dev логи включают:
- 🔍 Временные метки
- 🌐 API запросы к Product-Filter-Service
- 📱 Telegram сообщения
- ⚡ Производительность
- 🚨 Ошибки с деталями

### Пример логов:
```
🔍 [DEV] 2024-01-15T10:30:00.000Z - Инициализация бота в dev режиме
🌐 [API REQUEST] GET http://localhost:3001/videocards
✅ [API RESPONSE] 200
📱 [TELEGRAM] Chat 123456789: 🎮 Видеокарты (найдено 5)...
⚡ [PERF] getProducts: 150ms
```

## 🧪 Тестирование

### Мок данные:
```typescript
// Получить тестовые данные
const mockProducts = DevUtils.getMockProducts('videocards');
```

### Проверка dev режима:
```typescript
if (DevUtils.isDev()) {
  // Код только для разработки
  DevUtils.log('Отладочная информация');
}
```

## ⚙️ Конфигурация

### Переменные окружения:
```env
NODE_ENV=development
DEV_MODE=true
TG_BOT_TOKEN=your_bot_token
PRODUCT_FILTER_URL=http://localhost:3001
```

### nodemon.json:
```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "env": {
    "NODE_ENV": "development",
    "DEV_MODE": "true"
  }
}
```

## 🐛 Отладка

### Chrome DevTools:
```bash
# Запуск с отладкой
npm run dev:debug

# Открыть Chrome DevTools
chrome://inspect
```

### Логи ошибок:
```typescript
try {
  // Ваш код
} catch (error) {
  DevUtils.error('Описание ошибки', error);
}
```

## 📁 Структура dev файлов

```
src/
├── utils/
│   └── dev.utils.ts      # Dev утилиты
├── commands/
│   └── dev.command.ts    # Dev команды
├── register-commands.ts  # Регистрация dev команд
└── main.ts              # Dev логирование
```

## 🚨 Troubleshooting

### Бот не перезапускается:
1. Проверьте `nodemon.json`
2. Убедитесь что файл сохранен
3. Проверьте консоль на ошибки

### Dev команды не работают:
1. Проверьте `NODE_ENV=development`
2. Проверьте `DEV_MODE=true`
3. Перезапустите бота

### Product-Filter-Service недоступен:
```bash
# Проверка порта
netstat -ano | findstr :3001

# Проверка эндпоинта
curl http://localhost:3001/videocards

# Перезапуск сервиса
cd ../product-filter-service && npm run start:dev
```

## 🎯 Лучшие практики

1. **Всегда используйте dev режим для разработки**
2. **Логируйте важные операции через DevUtils**
3. **Тестируйте изменения через /dev_mock**
4. **Проверяйте Product-Filter-Service через /dev_health**
5. **Используйте /dev_stats для мониторинга**

## 🔄 Workflow разработки

1. Запустите `npm run dev`
2. Внесите изменения в код
3. Бот автоматически перезапустится
4. Протестируйте через Telegram
5. Используйте dev команды для отладки
6. Повторите цикл

---

**🚀 Удачной разработки!** 