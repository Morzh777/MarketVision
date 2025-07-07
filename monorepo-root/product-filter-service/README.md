# 🔀 Product-Filter-Service

## 📦 Описание

**Product-Filter-Service** — центральный хаб системы WBInfo для агрегации, фильтрации и кэширования товаров с WildBerries и Ozon. Работает как HTTP API для Telegram бота и как gRPC-клиент к парсерам.

## 🏗️ Архитектура

```
Bot (Telegram/HTTP) → Product-Filter-Service (HTTP API) → WB API (gRPC) + Ozon API (gRPC)
```

### Основные компоненты:
- **ProductsService** — логика агрегации, фильтрации, кэширования
- **RedisService** — кэширование и быстрый доступ
- **gRPC-клиенты** — связь с WB и Ozon API
- **PhotoService** — обработка изображений
- **PriceStatisticsService** — расширенная статистика цен
- **Validators** — валидация товаров по категориям

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run start:dev

# Сборка и запуск в проде
npm run build
npm run start:prod
```

## ⚙️ Переменные окружения

```env
REDIS_URL=redis://localhost:6379
WB_API_URL=localhost:3000
OZON_API_URL=localhost:3002
LOG_LEVEL=info
PORT=3001
```

## 📡 HTTP API Endpoints

### Поиск и фильтрация товаров
```http
POST /products/search
Content-Type: application/json

{
  "category": "videocards",
  "queries": ["rtx 5070", "rtx 5080", "rtx 5090"]
}
```

### Статистика цен
```http
GET /price-statistics/daily-summary/2024-01-15
GET /price-statistics/weekly-report/2024-W03
GET /price-statistics/market-insights
GET /price-statistics/bot-reports
```

### Проверка здоровья
```http
GET /health
```

## 🧩 Поддерживаемые категории

### Компьютерные комплектующие:
- **videocards** - Видеокарты (RTX 5070, RTX 5080, RTX 5090)
- **processors** - Процессоры (7800X3D, 9800X3D, 9950X3D)
- **motherboards** - Материнские платы (Z790, B760, X870E, B850)

### Игровые консоли:
- **playstation** - PlayStation 5 (PS5, PS5 Slim)
- **playstation_accessories** - Аксессуары PS5 (DualSense, PS5 Headset)
- **nintendo_switch** - Nintendo Switch (Switch 2, Switch OLED)

## 🔧 Технологический стек

- **Framework**: NestJS (TypeScript)
- **gRPC**: @grpc/grpc-js, @grpc/proto-loader
- **Кэширование**: Redis
- **Валидация**: class-validator, class-transformer
- **HTTP Client**: node-fetch

## 📁 Структура проекта

```
src/
├── main.ts                           # Точка входа
├── app.module.ts                     # Главный модуль
├── controllers/                      # HTTP контроллеры
│   ├── products.controller.ts       # API товаров
│   └── price-statistics.controller.ts # API статистики
├── services/                         # Бизнес-логика
│   ├── products.service.ts          # Основная логика
│   ├── redis.service.ts             # Кэширование
│   ├── photo.service.ts             # Обработка фото
│   └── price-statistics.service.ts  # Статистика цен
├── grpc-clients/                     # gRPC клиенты
│   ├── wb-api.client.ts             # Клиент WB API
│   └── ozon-api.client.ts           # Клиент Ozon API
├── validators/                       # Валидаторы товаров
│   ├── videocard.validator.ts       # Валидация видеокарт
│   ├── processors.validator.ts      # Валидация процессоров
│   ├── playstation.validator.ts     # Валидация PS5
│   └── validator.factory.ts         # Фабрика валидаторов
├── config/                          # Конфигурация
│   ├── categories.config.ts         # Настройки категорий
│   └── queries.config.ts            # Поисковые запросы
├── interfaces/                       # Интерфейсы
│   └── grpc.interfaces.ts           # gRPC интерфейсы
└── utils/                           # Утилиты
    └── logger.ts                    # Логирование
```

## 🧪 Тестирование

```bash
# Юнит-тесты
npm run test

# Тесты статистики
npm run test:statistics

# Расширенные тесты
npm run test:extended

# E2E тесты
npm run test:e2e
```

## 📊 Мониторинг и логи

- **Логи**: Все логи пишутся в папку `logs/`
- **Метрики**: Время обработки, кэш hits/misses, статистика цен
- **Health Check**: `GET /health`

## 🛠️ gRPC интеграция

- **Протокол**: `proto/raw-product.proto`
- **Клиенты**: WB API (порт 3000), Ozon API (порт 3002)
- **Методы**: GetRawProducts, агрегация данных

## 💡 Особенности разработки

### Proto файлы
- Путь к proto файлам: `process.cwd() + 'proto/raw-product.proto'`
- Работает одинаково в dev/prod режимах
- Не требуется копировать в dist/

### Кэширование
- **Redis** для хранения цен и истории
- **TTL** для автоматической очистки
- **Ключи**: `price:{category}:{id}`, `posted:{category}:{id}`

### Валидация
- **Категорийные валидаторы** для каждого типа товаров
- **Фильтрация** нерелевантных товаров
- **Проверка** обязательных полей

## ❓ FAQ / Типовые ошибки

**Q: Ошибка ENOENT: no such file or directory, open '.../proto/raw-product.proto'**
- A: Проверьте, что proto-файл лежит в папке `proto/` в корне сервиса

**Q: gRPC не может подключиться к WB/Ozon API**
- A: Проверьте переменные окружения `WB_API_URL` и `OZON_API_URL`

**Q: Redis не подключается**
- A: Проверьте переменную `REDIS_URL` и что Redis-сервер запущен

## 📚 Полезные команды

```bash
# Запуск сервиса
npm run start:dev

# Сборка и запуск в проде
npm run build
npm run start:prod

# Тесты
npm run test:all

# Проверка Redis
node check-redis.ts

# Просмотр логов
node view-logs.js
```

---

**Product-Filter-Service** — центральный хаб для агрегации и фильтрации товаров с WildBerries и Ozon! 🚀
