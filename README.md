# 🛍️ WB Info - Мониторинг цен и парсинг товаров

Комплексная система для мониторинга цен на Wildberries и парсинга DNS-shop с фильтрацией товаров.

## 🏗️ Архитектура проекта

```
wbinfo/
├── monorepo-root/
│   ├── wb-api/          # WB API сервис (NestJS)
│   ├── bot/             # Telegram бот (TypeScript)
│   ├── dns-api/         # DNS парсер API (Python/FastAPI)
│   └── product-filter-service/  # gRPC сервис фильтрации
├── tests/               # Общие тесты
└── README.md           # Этот файл
```

### 🔄 Поток данных и взаимодействие компонентов

```
[Telegram Bot] ←→ [Product-Filter-Service] ←→ [WB-API] ←→ [WildBerries]
                         ↓ ↑                    [DNS-API] ←→ [DNS.shop]
                    [Redis Cache]
                (цены + история + агрегация)
```

#### 🎯 Принципы чистой архитектуры

**1️⃣ Разделение ответственности:**
- **Telegram Bot**: ТОЛЬКО интерфейс пользователя - отправляет запросы раз в час, получает готовые посты
- **Product-Filter-Service**: Центральный сервис - агрегирует данные от всех парсеров, фильтрует, кэширует, находит лучшие цены
- **WB-API**: Парсер WildBerries - возвращает сырые данные
- **DNS-API**: Парсер DNS-shop - возвращает сырые данные

**2️⃣ Микросервисная архитектура:**
- Каждый сервис независим и может быть развернут отдельно
- Связь через HTTP REST API и gRPC
- Единый Redis для кэширования

**3️⃣ Слои архитектуры:**

```
📱 Presentation Layer (Telegram Bot UI)
          ↓
🔀 Application Layer (Product-Filter-Service)
          ↓
🏛️ Domain Layer (Business Logic & Validators)
          ↓
🗄️ Infrastructure Layer (WB-API, Redis, DNS-API)
```

### 🔍 Детальное описание компонентов

#### 🤖 **Telegram Bot** (`monorepo-root/bot/`)
- **Назначение**: ТОЛЬКО пользовательский интерфейс - НЕ содержит бизнес-логики
- **Технологии**: TypeScript, node-telegram-bot-api  
- **Функции**:
  - Команды поиска товаров (`/videocards`, `/processors`, `/motherboards`)
  - Планировщик: раз в час запрашивает посты у Product-Filter-Service
  - Отправка готовых постов пользователям
  - **НЕ работает с Redis** - вся логика в Product-Filter-Service

#### 🌐 **Product-Filter-Service** (`monorepo-root/product-filter-service/`)
- **Назначение**: Центральный hub всей бизнес-логики системы
- **Технологии**: NestJS, gRPC, Redis
- **Архитектура**: Clean Architecture с явным разделением слоев
- **Функции**:
  - **Агрегация данных**: Собирает данные от всех парсеров (WB-API, DNS-API, ...)
  - **Поиск лучших цен**: Находит самую низкую цену на каждый товар среди всех источников
  - **Умная фильтрация**: Отдает боту только новые товары или со значительными скидками (>0.5%)
  - **Кэширование**: Единственный компонент работающий с Redis (цены + история публикаций)
  - **Валидация товаров**: RTX, X3D, Chipset валидаторы
  - **Интеграция фото**: Добавляет фотографии товаров
  - **Дедупликация**: Предотвращает повторные публикации

#### 📡 **WB-API** (`monorepo-root/wb-api/`)
- **Назначение**: Парсинг сырых данных с WildBerries
- **Технологии**: NestJS, Rate Limiting, HTTP Client
- **Принципы**: 
  - Возвращает **только сырые данные** без обработки
  - Не содержит бизнес-логики фильтрации
  - Реализует rate limiting для защиты от блокировок
  - Поддерживает множественные поисковые запросы по категориям
- **Endpoints**:
  - `GET /parser/videocards` - видеокарты
  - `GET /parser/processors` - процессоры  
  - `GET /parser/motherboards` - материнские платы

#### 🔍 **DNS-API** (`monorepo-root/dns-api/`)
- **Назначение**: Независимый парсер DNS-shop
- **Технологии**: Python, FastAPI, Selenium, undetected-chromedriver
- **Особенности**:
  - Эмуляция реального пользователя для обхода анти-бот защиты
  - Поддержка headless/GUI режимов
  - Параллельный парсинг нескольких ссылок
  - Собственная система фильтрации

#### 🗄️ **Redis Cache**
- **Назначение**: Единое хранилище для Product-Filter-Service (ТОЛЬКО он работает с Redis)
- **Структура данных**:
  ```
  price:videocards:{stableId} → лучшая цена товара среди всех источников
  last_posted_price:videocards:{stableId} → последняя отправленная цена
  posted:videocards:{stableId} → флаг что товар уже публиковался
  product:cache:{category}:{query} → кэш агрегированных результатов
  source:wb:{productId} → данные от WB-API
  source:dns:{productId} → данные от DNS-API
  ```

### 🔄 Поток обработки данных

#### 1️⃣ **Планировщик бота (раз в час)**
```
Telegram Bot → Product-Filter-Service → "Дай мне новые посты для публикации"
```

#### 2️⃣ **Агрегация данных от всех парсеров**
```
Product-Filter-Service → [WB-API, DNS-API, ...] → [WildBerries, DNS.shop, ...] → сырые данные
```

#### 3️⃣ **Поиск лучших цен и агрегация**
```
Сырые данные от всех источников → Группировка по товарам → Поиск минимальной цены
```

#### 4️⃣ **Интеллектуальная фильтрация**
```
Лучшие цены → Валидаторы → Проверка в Redis (цены + история) → Фильтрация изменений
```

#### 5️⃣ **Принятие решения о публикации**
- **Новый товар с лучшей ценой**: ✅ Готовим пост
- **Цена не изменилась**: ❌ Пропускаем  
- **Уже публиковали этот товар**: ❌ Пропускаем
- **Скидка < 0.5%**: ❌ Пропускаем
- **Скидка ≥ 0.5%**: ✅ Готовим пост с данными о скидке

#### 6️⃣ **Возврат готовых постов боту**
```
Готовые посты → Product-Filter-Service → Telegram Bot → Публикация пользователям
```

### 🧪 **Тестирование архитектуры**

Проект включает полный набор архитектурных тестов:

```bash
cd tests
npm run test:architecture  # Проверка всей цепочки взаимодействия
```

**Проверяемые принципы:**
- ✅ WB-API возвращает только сырые данные (без previousPrice/discount)
- ✅ Product-Filter добавляет обработку и фильтрацию
- ✅ Система кэширования цен работает корректно
- ✅ Интеграция фотографий функционирует
- ✅ Фильтрация снижает количество публикуемых товаров

### 🎯 **Преимущества архитектуры**

1. **Модульность**: Каждый сервис можно развивать и деплоить независимо
2. **Масштабируемость**: Можно добавлять новые источники данных (Ozon, AliExpress)
3. **Надежность**: Отказ одного сервиса не влияет на работу других
4. **Тестируемость**: Четкое разделение ответственности упрощает unit и integration тесты
5. **Производительность**: Умное кэширование и фильтрация снижают нагрузку на внешние API

## 📋 **Стандарт данных для парсеров**

> ⚠️ **КРИТИЧЕСКИ ВАЖНО!** Все новые парсеры должны соответствовать единому стандарту данных.

📖 **[Полная документация стандарта →](PARSER-DATA-STANDARD.md)**

### 🎯 Основные требования:

```json
{
  "results": [
    {
      "query": "rtx 4070",
      "products": [
        {
          "id": "123456789",           // 🔑 УНИКАЛЬНЫЙ ID (критично!)
          "name": "RTX 4070 Gaming OC", // 📝 Полное название
          "price": 65000,               // 💰 Цена в рублях (число)
          "image_url": "https://..."    // 🖼️ Фото товара
        }
      ]
    }
  ]
}
```

### ✅ **Чек-лист для нового парсера:**

- [ ] **ID уникален** для каждого товара (ID ≠ stableId из названия)
- [ ] **Название полное** и информативное  
- [ ] **Цена** — число в рублях (не строка, не копейки)
- [ ] **Query** соответствует поисковому запросу
- [ ] **Тестирование** на Product-Filter-Service
- [ ] **Группировка** работает корректно (выбирает минимальную цену)

### 🚨 **Частые ошибки:**

```json
// ❌ НЕПРАВИЛЬНО: одинаковые ID
{"id": "123", "name": "RTX 4070 Gaming", "price": 65000}
{"id": "123", "name": "RTX 4070 SUPRIM", "price": 62000}

// ✅ ПРАВИЛЬНО: уникальные ID  
{"id": "123", "name": "RTX 4070 Gaming", "price": 65000}
{"id": "456", "name": "RTX 4070 SUPRIM", "price": 62000}
```

**Результат:** Product-Filter-Service выберет RTX 4070 SUPRIM за 62,000₽ как самый выгодный! 🎯

## 🚀 БЫСТРЫЙ ЗАПУСК ВСЕХ СЕРВИСОВ

### 📋 Предварительные требования

```bash
# Node.js 18+
node --version

# Python 3.11+
python --version

# Docker (опционально)
docker --version
```

## 🔧 КОМАНДЫ ЗАПУСКА

### 1️⃣ WB API (Основной сервис)
```bash
cd monorepo-root/wb-api
npm install
npm run start:dev
# Запускается на: http://localhost:3000
# Swagger: http://localhost:3000/api
```

### 2️⃣ Product Filter Service (gRPC)
```bash
cd product-filter-service
npm install
npm run start:dev
# gRPC сервер на порту: 50051
```

### 3️⃣ Telegram Bot
```bash
cd monorepo-root/bot
npm install
# Настроить .env с TELEGRAM_BOT_TOKEN
npm run start:dev
```

### 4️⃣ DNS API (Парсер)
```bash
cd monorepo-root/dns-api
pip install -r requirements.txt
python src/presentation/main.py
# Запускается на: http://localhost:8000
# Docs: http://localhost:8000/docs
```

## 🐳 DOCKER ЗАПУСК

### Запуск всех сервисов одной командой:
```bash
# Из корневой директории
docker-compose up -d

# Проверка статуса
docker-compose ps

# Логи
docker-compose logs -f
```

### Отдельные сервисы:
```bash
# Только WB API + Redis
docker-compose up wb-api redis -d

# Только DNS API
docker-compose up dns-api -d

# Только Product Filter Service
docker-compose up product-filter-service -d
```

## 🔗 ENDPOINTS И ПОРТЫ

| Сервис | Порт | URL | Описание |
|--------|------|-----|----------|
| WB API | 3000 | http://localhost:3000 | Основной API для WB |
| DNS API | 8000 | http://localhost:8000 | Парсер DNS-shop |
| Product Filter | 50051 | grpc://localhost:50051 | gRPC фильтрация |
| Redis | 6379 | redis://localhost:6379 | Кеш |
| Telegram Bot | - | - | Работает через Telegram |

## 📚 ДОКУМЕНТАЦИЯ API

### WB API (Swagger)
```bash
# После запуска WB API
open http://localhost:3000/api
```

### DNS API (FastAPI Docs)
```bash
# После запуска DNS API
open http://localhost:8000/docs
```

## 🧪 ТЕСТИРОВАНИЕ

### Тесты WB API
```bash
cd monorepo-root/wb-api
npm run test
npm run test:e2e
```

### Тесты Product Filter Service
```bash
cd product-filter-service
npm run test
```

### Тесты DNS API
```bash
cd monorepo-root/dns-api
python -m pytest
# Или запуск тестового скрипта
python ../../test_dns_real_parsing.py
```

### Общие тесты
```bash
cd tests
npm install
npm run test:all-categories
npm run test:grpc-service
```

## ⚙️ КОНФИГУРАЦИЯ

### Переменные окружения

#### WB API (.env)
```env
REDIS_URL=redis://localhost:6379
GRPC_PRODUCT_FILTER_URL=localhost:50051
PORT=3000
```

#### DNS API (.env)
```env
HEADLESS_MODE=true
REDIS_URL=redis://localhost:6379
MAX_CONCURRENT_PARSERS=3
```

#### Telegram Bot (.env)
```env
TELEGRAM_BOT_TOKEN=your_bot_token
WB_API_URL=http://localhost:3000
```

#### Product Filter Service (.env)
```env
REDIS_URL=redis://localhost:6379
GRPC_PORT=50051
```

## 🔍 ОСНОВНЫЕ ФУНКЦИИ

### WB API
- ✅ Парсинг товаров Wildberries
- ✅ Фильтрация по категориям (CPU, видеокарты, материнки)
- ✅ Кеширование результатов
- ✅ Rate limiting
- ✅ gRPC интеграция с фильтрами

### DNS API  
- ✅ Парсинг DNS-shop с эмуляцией пользователя
- ✅ Поддержка множественных ссылок
- ✅ Реалистичное поведение (анти-бот)
- ✅ Фильтрация товаров

### Product Filter Service
- ✅ gRPC сервис фильтрации
- ✅ X3D валидация для процессоров
- ✅ RTX валидация для видеокарт
- ✅ Chipset валидация для материнок

### Telegram Bot
- ✅ Команды поиска товаров
- ✅ Интеграция с WB API
- ✅ Уведомления о ценах

## 🛠️ РАЗРАБОТКА

### 🆕 Добавление нового парсера

1. **Изучите стандарт данных**: [`PARSER-DATA-STANDARD.md`](PARSER-DATA-STANDARD.md)
2. **Реализуйте парсер** согласно стандарту
3. **Протестируйте формат данных**:
   ```bash
   cd tests
   node test-parser-format.js your-parser-url
   ```
4. **Интегрируйте с Product-Filter-Service**
5. **Добавьте в WB-API** (опционально для агрегации)

### Добавление новых фильтров
```bash
cd product-filter-service/src/validators
# Создать новый валидатор
# Зарегистрировать в validators.module.ts
```

### Добавление новых категорий
```bash
cd monorepo-root/wb-api/src/parser/application/services
# Создать новый сервис категории
# Добавить контроллер в presentation/controllers
```

### Отладка
```bash
# Логи WB API
cd monorepo-root/wb-api && npm run start:debug

# Логи DNS API
cd monorepo-root/dns-api && python src/presentation/main.py --debug

# Тестирование gRPC
cd tests && node test-grpc-service.js
```

## 📊 МОНИТОРИНГ

### Health Checks
```bash
# WB API
curl http://localhost:3000/health

# DNS API  
curl http://localhost:8000/health

# Product Filter Service
grpcurl -plaintext localhost:50051 list
```

### Метрики Redis
```bash
redis-cli info
redis-cli monitor
```

## 🗄️ УПРАВЛЕНИЕ REDIS

### 📊 Проверка состояния Redis

#### 🐳 **Через Docker (основной способ):**
```bash
# Статус подключения
docker exec -it redis redis-cli ping
# Ответ: PONG

# Информация о Redis
docker exec -it redis redis-cli info

# Количество ключей в базе
docker exec -it redis redis-cli dbsize

# Список всех ключей (осторожно на продакшене!)
docker exec -it redis redis-cli keys "*"

# Поиск ключей по паттерну
docker exec -it redis redis-cli keys "product:*"
docker exec -it redis redis-cli keys "price:videocards:*"
```

#### 💻 **Локально (если Redis установлен):**
```bash
# Статус подключения
redis-cli ping
# Ответ: PONG

# Информация о Redis
redis-cli info

# Количество ключей в базе
redis-cli dbsize

# Поиск ключей по паттерну
redis-cli keys "product:*"
redis-cli keys "price:videocards:*"
```

### 🧹 ОЧИСТКА КЕША REDIS

#### 🐳 **Полная очистка через Docker:**
```bash
# ⚠️ ОСТОРОЖНО: удаляет ВСЕ данные в Redis
docker exec -it redis redis-cli flushall

# Проверить, что очистилось
docker exec -it redis redis-cli dbsize
# Ответ: (integer) 0
```

#### 💻 **Локально (если Redis установлен):**
```bash
# ⚠️ ОСТОРОЖНО: удаляет ВСЕ данные в Redis
redis-cli flushall
```

#### 🐳 **Выборочная очистка через Docker:**
```bash
# Очистить все цены товаров
docker exec redis redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'price:*')) do redis.call('DEL', name); end" 0

# Очистить кеш конкретной категории
docker exec redis redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'product:cache:videocards:*')) do redis.call('DEL', name); end" 0

# Очистить историю публикаций
docker exec redis redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'last_posted_price:*')) do redis.call('DEL', name); end" 0
docker exec redis redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'posted:*')) do redis.call('DEL', name); end" 0

# Универсальная команда для удаления по паттерну
docker exec redis redis-cli eval "return redis.call('del', unpack(redis.call('keys', ARGV[1])))" 0 "product:*"
```

#### 💻 **Локально:**
```bash
# Очистить все цены товаров
redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'price:*')) do redis.call('DEL', name); end" 0

# Очистить кеш конкретной категории
redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'product:cache:videocards:*')) do redis.call('DEL', name); end" 0

# Очистить историю публикаций
redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'last_posted_price:*')) do redis.call('DEL', name); end" 0
redis-cli eval "for i, name in ipairs(redis.call('KEYS', 'posted:*')) do redis.call('DEL', name); end" 0
```

#### Очистка через Docker
```bash
# Проверить запущенные контейнеры Redis
docker ps | grep redis

# Подключиться к Redis в контейнере
docker exec -it redis redis-cli

# Или выполнить команды напрямую
docker exec redis redis-cli flushall
docker exec redis redis-cli del "price:videocards:*"
```

### 🔍 МОНИТОРИНГ И ОТЛАДКА REDIS

#### Просмотр данных
```bash
# Получить значение ключа
redis-cli get "price:videocards:123456"

# Получить все поля hash-объекта
redis-cli hgetall "product:cache:videocards:rtx4070"

# Получить тип данных ключа
redis-cli type "price:videocards:123456"

# Получить время жизни ключа (TTL)
redis-cli ttl "product:cache:videocards:rtx4070"
```

#### Мониторинг в реальном времени
```bash
# Просмотр всех команд Redis в реальном времени
redis-cli monitor

# Статистика команд
redis-cli info commandstats

# Медленные запросы
redis-cli slowlog get 10
```

#### Анализ памяти
```bash
# Использование памяти
redis-cli info memory

# Анализ использования памяти по ключам
redis-cli --bigkeys

# Размер конкретного ключа
redis-cli memory usage "price:videocards:123456"
```

### 🧪 ПОЛЕЗНЫЕ КОМАНДЫ ДЛЯ РАЗРАБОТКИ

#### Сброс кеша для тестирования
```bash
# Очистить только кеш продуктов (данные останутся)
redis-cli del "product:cache:videocards:*"

# Очистить историю для повторного тестирования
redis-cli flushall && echo "✅ Redis очищен - можно тестировать заново"

# Проверить, что кеш пуст
redis-cli dbsize
# Ответ: (integer) 0
```

#### Бэкап и восстановление
```bash
# Создать дамп базы
redis-cli save
# Файл сохранится в /var/lib/redis/dump.rdb

# Экспорт данных в JSON
redis-cli --scan --pattern "*" | while read key; do
    echo "$key: $(redis-cli get "$key")"
done > redis_backup.txt

# Восстановление из файла (при перезапуске Redis)
# Файл dump.rdb автоматически загружается при старте
```

### 🚨 ТИПИЧНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

#### Redis недоступен
```bash
# Проверить статус Redis
redis-cli ping

# Если ошибка "Connection refused"
sudo systemctl start redis
# или для Docker:
docker-compose up redis -d

# Проверить порт
netstat -tulpn | grep 6379
```

#### Переполнение памяти
```bash
# Проверить использование памяти
redis-cli info memory

# Очистить старые данные
redis-cli flushall

# Настроить лимит памяти в redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

#### Медленные запросы
```bash
# Включить логирование медленных запросов
redis-cli config set slowlog-log-slower-than 10000

# Посмотреть медленные запросы
redis-cli slowlog get 5
```

### 📋 СТРУКТУРА ДАННЫХ В REDIS

```bash
# Кеш цен товаров
price:videocards:{stableId} → "65000"
price:processors:{stableId} → "45000"
price:motherboards:{stableId} → "15000"

# История публикаций
last_posted_price:videocards:{stableId} → "64000"
posted:videocards:{stableId} → "1"

# Кеш результатов поиска
product:cache:videocards:rtx4070 → JSON с результатами
product:cache:processors:i7 → JSON с результатами

# Данные источников
source:wb:{productId} → JSON данные от WB-API
source:dns:{productId} → JSON данные от DNS-API
```

### ⚡ БЫСТРЫЕ КОМАНДЫ

```bash
# Проверить подключение
redis-cli ping

# Полная очистка
redis-cli flushall

# Количество ключей
redis-cli dbsize

# Очистить кеш продуктов
redis-cli eval "return redis.call('del', unpack(redis.call('keys', 'product:cache:*')))" 0

# Очистить историю постов
redis-cli eval "return redis.call('del', unpack(redis.call('keys', 'posted:*')))" 0

# Мониторинг команд
redis-cli monitor
```

## 🚨 TROUBLESHOOTING

### Проблемы с Chrome (DNS API)
```bash
# Проверить версию Chrome
google-chrome --version

# Обновить Chrome
# chrome://settings/help

# Проверить ChromeDriver
cd monorepo-root/dns-api
python -c "import undetected_chromedriver as uc; print(uc.Chrome())"
```

### Проблемы с gRPC
```bash
# Проверить порт
netstat -tulpn | grep 50051

# Перезапуск сервиса
cd product-filter-service
npm run start:dev
```

### Очистка кеша
```bash
# Redis
redis-cli flushall

# Или через API
curl -X DELETE http://localhost:3000/cache/clear
```

## 📝 ЛОГИ

```bash
# Все логи Docker
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f wb-api
docker-compose logs -f dns-api

# Логи без Docker
tail -f monorepo-root/wb-api/logs/app.log
tail -f monorepo-root/dns-api/logs/parser.log
```

## 🎯 ПОЛЕЗНЫЕ КОМАНДЫ

```bash
# Остановка всех сервисов
docker-compose down

# Пересборка образов
docker-compose build --no-cache

# Очистка Docker
docker system prune -a

# Проверка всех портов
netstat -tulpn | grep -E "(3000|8000|50051|6379)"

# Быстрая проверка всех сервисов
curl http://localhost:3000/health && \
curl http://localhost:8000/health && \
echo "Все сервисы работают!"
```

---

## 🤝 Contributing

1. Fork проект
2. Создай feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Открой Pull Request

## 📄 License

Этот проект под лицензией MIT - см. файл [LICENSE](LICENSE).

---

**🚀 Удачной разработки!**