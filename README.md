# 🚀 MarketVision - Система мониторинга цен на компьютерные комплектующие

## 📋 Описание проекта

MarketVision - это система мониторинга цен на компьютерные комплектующие с интеграцией WildBerries и Ozon. Проект построен на микросервисной архитектуре с использованием gRPC для межсервисного взаимодействия.

## 🏗️ Финальная архитектура

```
Bot (Telegram)
   ↓
Product-Filter-Service (порт 3001)
   ↓
+-------------------+
|                   |
WB-API (порт 3000)  Ozon-API (порт 3002)
|                   |
+-------------------+
   ↓
db-api (порт 3003, Postgres)
```

### Микросервисы:
- **Bot** (порт 3002) — Telegram-бот с генерацией изображений
- **Product-Filter-Service** (порт 3001) — Центральный хаб агрегации, фильтрации и валидации
- **WB-API** (порт 3000) — Парсер WildBerries с gRPC сервером
- **Ozon-API** (порт 3002) — Парсер Ozon с gRPC сервером (Python)
- **db-api** (порт 3003) — Сервис хранения товаров и истории цен (NestJS + Prisma + Postgres)

## 📁 Структура проекта

```
wbinfo/
├── monorepo-root/
│   ├── bot/                    # Telegram-бот (NestJS)
│   ├── product-filter-service/ # Центральный сервис (NestJS)
│   ├── wb-api/                # WB парсер (NestJS)
│   ├── ozon-api/              # Ozon парсер (Python)
│   ├── db-api/                # Сервис хранения товаров и истории цен (NestJS)
│   └── logs/                  # Логи всех сервисов
├── tests/                     # Тесты и анализ данных
├── PARSER-DATA-STANDARD.md    # Стандарт данных парсеров
├── API-DATA-STANDARD.md       # Стандарт API данных
└── README.md                  # Этот файл
```

## 🚀 Быстрый старт

### 1. Запуск всех сервисов

```bash
# Запустить все сервисы через Docker Compose
# (db-api и Postgres поднимутся автоматически)
docker-compose up -d

# Или запустить вручную:
cd monorepo-root/bot && npm run start:dev
cd monorepo-root/product-filter-service && npm run start:dev  
cd monorepo-root/wb-api && npm run start:dev
cd monorepo-root/ozon-api && python src/main.py
cd monorepo-root/db-api && npm run start:dev
```

### 2. Проверка статуса

```bash
# Проверить что все сервисы работают
npm run test:architecture
```

## 📊 Поддерживаемые категории

### Компьютерные комплектующие:
- **Видеокарты** - RTX 5070, RTX 5080, RTX 5090
- **Процессоры** - 7800X3D, 9800X3D, 9950X3D  
- **Материнские платы** - Z790, B760, X870E, B850

### Игровые консоли:
- **PlayStation 5** - PS5, PS5 Slim
- **PlayStation Accessories** - DualSense, PS5 Headset
- **Nintendo Switch** - Switch 2, Switch OLED

## 🔧 Технологический стек

- **Backend**: NestJS (TypeScript), Python
- **Межсервисное взаимодействие**: gRPC
- **Кэширование**: Redis
- **Парсинг**: Selenium, undetected-chromedriver
- **Генерация изображений**: Sharp
- **Тестирование**: Jest, Node.js

## 📡 API Endpoints

### Product-Filter-Service (порт 3001)
- `POST /products/search` - Поиск и фильтрация товаров
- `GET /price-statistics/daily-summary/:date` - Ежедневная сводка
- `GET /price-statistics/weekly-report/:weekKey` - Недельный отчёт

### WB-API (порт 3000)
- `GET /parser/videocards` - Парсинг видеокарт
- `GET /parser/cpus` - Парсинг процессоров
- `GET /parser/motherboards` - Парсинг материнских плат

### Ozon-API (порт 3002)
- gRPC сервер для Product-Filter-Service

### db-api (порт 3003)
- gRPC методы для пакетной записи и чтения товаров и истории цен
- Валидация и нормализация данных
- Хранение в Postgres через Prisma

## 🧪 Тестирование

```bash
cd tests

# Анализ сырых данных API
node api_responce/analyze-raw-api-data.js

# Тестирование архитектуры
npm run test:architecture

# Проверка формата данных парсеров
node test-parser-format.js
```

## 📋 Стандарты данных

### PARSER-DATA-STANDARD.md
Обязательные поля для всех парсеров:
- `id` (уникальный!)
- `name` 
- `price` (число в рублях)
- `query`

### API-DATA-STANDARD.md
Стандарт данных для API ответов с фильтрацией и кэшированием.

## 🔄 Команды разработки

```bash
# Сборка всех сервисов
npm run build

# Тестирование архитектуры
npm run test:architecture

# Очистка кэшей
npm run clear:cache

# Перегенерация proto файлов
npm run build:proto
```

### Портфолио сервисов
- **Bot**: http://localhost:3002/health
- **Product-Filter-Service**: http://localhost:3001/health  
- **WB-API**: http://localhost:3000/health
- **Ozon-API**: gRPC на порту 3002
- **db-api**: http://localhost:3003/health


## 🎯 Цели проекта

- [x] Мониторинг цен на WildBerries
- [x] Мониторинг цен на Ozon  
- [x] Фильтрация и валидация товаров
- [x] Telegram бот для уведомлений
- [x] Генерация красивых изображений с шаблоном
- [x] Поддержка игровых консолей
- [x] gRPC межсервисное взаимодействие
- [ ] Веб-интерфейс для администрирования
- [ ] Аналитика и отчеты

### Документация
- **PARSER-DATA-STANDARD.md** - Стандарт данных парсеров
- **API-DATA-STANDARD.md** - Стандарт API данных
- **DEVELOPER_GUIDE.md** - Гайд для разработчиков

---

**MarketVision** - быстрая, надёжная и расширяемая система мониторинга цен на компьютерные комплектующие! 🚀