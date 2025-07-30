# 🚀 Руководство разработчика MarketVision

## 📋 Содержание

1. [🏗️ Архитектура системы](#️-архитектура-системы)
2. [🐳 Docker и развертывание](#-docker-и-развертывание)
3. [➕ Добавление новых сервисов](#-добавление-новых-сервисов)
4. [🔗 gRPC интеграция](#-grpc-интеграция)
5. [📁 Структура проекта](#-структура-проекта)
6. [⚙️ Конфигурация](#️-конфигурация)
7. [🧪 Тестирование](#-тестирование)
8. [🐛 Отладка](#-отладка)
9. [✅ Система валидации](#-система-валидации)


---

## 🏗️ Архитектура системы

### 🚀 Быстрый справочник по портам:
- **WB API**: `http://localhost:3006` - HTTP health, `localhost:3000` - gRPC парсер WildBerries
- **Product Filter Service**: `http://localhost:3001` - REST API центральный сервис
- **Ozon API**: `http://localhost:3005` - HTTP health, `localhost:3002` - gRPC парсер Ozon
- **DB API**: `http://localhost:3003` - API базы данных
- **MarketVision API**: `http://localhost:3004` - Веб-интерфейс (Next.js)
- **Product Filter Service**: `localhost:50051` - gRPC центральный сервис
- **PostgreSQL**: `localhost:5432` - База данных
- **Redis**: `localhost:6379` - Кэширование

### Текущая архитектура:
```
┌─────────────────┐    ┌──────────────────┐
│   Telegram Bot  │    │  MarketVision    │
│   (TypeScript)  │    │   (Next.js)      │
│   Port: N/A     │    │   Port: 3004     │
└─────────────────┘    └──────────────────┘
         │                       │
         └───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │ Product Filter   │
                    │   Service        │
                    │  (NestJS)        │
                    │  Port: 3001/50051│
                    └──────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WB API        │    │   DB API         │    │   Ozon API      │
│  (NestJS)       │    │  (NestJS)        │    │   (Python)      │
│  Port: 3000     │    │  Port: 3003      │    │   Port: 3002    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │   Database       │
                    │   Port: 5432     │
                    └──────────────────┘
```

### Распределение портов:
- **WB API**: `3006` - HTTP health, `3000` - gRPC парсер WildBerries
- **Product Filter Service**: `3001` - REST API центральный сервис
- **Ozon API**: `3005` - HTTP health, `3002` - gRPC парсер Ozon
- **DB API**: `3003` - API базы данных
- **MarketVision API**: `3004` - Веб-интерфейс (Next.js)
- **Product Filter Service**: `50051` - gRPC центральный сервис
- **PostgreSQL**: `5432` - База данных
- **Redis**: `6379` - Кэширование

### Ключевые принципы:
- ✅ **Product-Filter-Service** - центральный hub для агрегации данных
- ✅ **Микросервисная архитектура** с четким разделением ответственности
- ✅ **gRPC взаимодействие** между сервисами
- ✅ **PostgreSQL** для хранения данных через Prisma ORM
- ✅ **Docker контейнеры** для всех сервисов
- ✅ **Система валидации V2**

---

## 🐳 Docker и развертывание

### Текущая конфигурация Docker Compose:

```yaml
version: '3.8'

services:
  # Redis для кэширования
  redis:
    image: redis:7-alpine
    container_name: product-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - product-network

  # gRPC микросервис фильтрации продуктов
  product-filter-service:
    build:
      context: ./product-filter-service
      dockerfile: Dockerfile
    container_name: product-filter-service
    ports:
      - "50051:50051"
    environment:
      - REDIS_URL=redis://redis:6379
      - GRPC_PORT=50051
      - GRPC_HOST=0.0.0.0
      - LOG_LEVEL=info
    depends_on:
      - redis
    volumes:
      - ./product-filter-service/logs:/app/logs
    networks:
      - product-network
    restart: unless-stopped

  # WB API сервис
  wb-api:
    build:
      context: ./monorepo-root/wb-api
      dockerfile: Dockerfile
    container_name: wb-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - REDIS_URL=redis://redis:6379
      - PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051
      - LOG_LEVEL=info
    depends_on:
      - redis
      - product-filter-service
    networks:
      - product-network
    restart: unless-stopped

  # DB API сервис
  db-api:
    build:
      context: ./monorepo-root/db-api
      dockerfile: Dockerfile
    container_name: db-api
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/marketvision
      - PORT=3003
    depends_on:
      - postgres
    networks:
      - product-network
    restart: unless-stopped

  # Ozon API сервис
  ozon-api:
    build:
      context: ./monorepo-root/ozon-api
      dockerfile: Dockerfile
    container_name: ozon-api
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051
      - LOG_LEVEL=info
    depends_on:
      - product-filter-service
    networks:
      - product-network
    restart: unless-stopped

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      - POSTGRES_DB=marketvision
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - product-network
    restart: unless-stopped

  # MarketVision API (Next.js)
  marketvision-api:
    build:
      context: ./monorepo-root/marketvision-api
      dockerfile: Dockerfile
    container_name: marketvision-api
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - PORT=3004
    depends_on:
      - product-filter-service
    networks:
      - product-network
    restart: unless-stopped

  # Telegram Bot
  telegram-bot:
    build:
      context: ./monorepo-root/bot
      dockerfile: Dockerfile
    container_name: telegram-bot
    environment:
      - NODE_ENV=production
      - TG_BOT_TOKEN=your_bot_token
      - WB_API_URL=http://wb-api:3000
      - PRODUCT_FILTER_URL=http://product-filter-service:50051
    depends_on:
      - wb-api
      - product-filter-service
    networks:
      - product-network
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:

networks:
  product-network:
    driver: bridge
```

### Команды для работы с Docker:

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f [service-name]

# Пересборка и перезапуск
docker-compose up -d --build

# Остановка всех сервисов
docker-compose down

# Очистка данных
docker-compose down -v

# Проверка статуса
docker-compose ps
```

---

## ➕ Добавление новых сервисов

### Шаг 1: Создание нового API сервиса

Создайте новый сервис в `monorepo-root/[new-api]/`:

```typescript
// Пример структуры для нового API
src/
├── main.ts
├── app.module.ts
├── grpc-server/
│   └── grpc-server.service.ts
├── parser/
│   └── [new]-parser.service.ts
├── dto/
│   └── raw-product.dto.ts
└── types/
    └── raw-product.interface.ts
```

### Шаг 2: Добавление в Docker Compose

```yaml
# Добавить в docker-compose.yml
new-api:
  build:
    context: ./monorepo-root/new-api
    dockerfile: Dockerfile
  container_name: new-api
  ports:
    - "3004:3004"  # Уникальный порт
  environment:
    - PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051
    - REDIS_URL=redis://redis:6379
  depends_on:
    - product-filter-service
    - redis
  networks:
    - product-network
  restart: unless-stopped
```

### Шаг 3: Интеграция с Product-Filter-Service

Добавьте gRPC клиент в `product-filter-service/src/grpc-clients/`:

```typescript
// new-api.client.ts
@Injectable()
export class NewApiClient {
  private client: any;
  
  constructor() {
    this.client = new NewApiServiceClient('new-api:3004');
  }
  
  async filterProducts(request: FilterRequest): Promise<FilterResponse> {
    return this.client.filterProducts(request);
  }
}
```

### Шаг 4: Обновление конфигурации категорий

Добавьте в `product-filter-service/src/config/categories.config.ts`:

```typescript
export const CATEGORIES: Record<string, CategoryConfig> = {
  // ... существующие категории
  new_category: {
    ozon: 'new-category-slug',
    wb: 'new-category-id',
    new_api: 'new-category-config'  // Для нового API
  }
};
```

---

## 🔗 gRPC интеграция

### Product-Filter-Service как центральный hub:

```typescript
// product-filter-service/src/services/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    private readonly wbApiClient: WbApiClient,
    private readonly ozonApiClient: OzonApiClient,
    private readonly dbApiClient: DbApiClient,
    private readonly redisService: RedisService
  ) {}

  async getProducts(query: string, category: string) {
    // 1. Проверяем кэш
    const cached = await this.redisService.get(`products:${category}:${query}`);
    if (cached) return cached;

    // 2. Запрашиваем данные от всех API
    const [wbProducts, ozonProducts, dbProducts] = await Promise.all([
      this.wbApiClient.filterProducts({ query, category }),
      this.ozonApiClient.filterProducts({ query, category }),
      this.dbApiClient.getProducts({ query, category })
    ]);

    // 3. Агрегируем и фильтруем
    const allProducts = [...wbProducts, ...ozonProducts, ...dbProducts];
    const filtered = this.filterProducts(allProducts, category);

    // 4. Кэшируем результат
    await this.redisService.set(`products:${category}:${query}`, filtered, 3600);

    return filtered;
  }
}
```

### Структура кэша Redis:

| Ключ | Описание | TTL |
|------|----------|-----|
| `products:category:query` | Отфильтрованные товары | 1 час |
| `raw:wb:category:query` | Сырые данные WB | 30 мин |
| `raw:ozon:category:query` | Сырые данные Ozon | 30 мин |
| `raw:db:category:query` | Данные из БД | 30 мин |
| `photos:category:product_id` | Фотографии товаров | 24 часа |

---

## 📁 Структура проекта

```
wbinfo/
├── monorepo-root/
│   ├── bot/                        # Telegram бот (TypeScript)
│   │   ├── src/
│   │   │   ├── commands/           # Команды бота
│   │   │   ├── services/           # Сервисы
│   │   │   ├── utils/              # Утилиты
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── product-filter-service/     # Центральный API (NestJS)
│   │   ├── src/
│   │   │   ├── controllers/        # HTTP контроллеры
│   │   │   ├── services/           # Бизнес-логика
│   │   │   │   └── validation.service/ # Система валидации V2
│   │   │   ├── grpc-clients/       # gRPC клиенты к API
│   │   │   ├── config/             # Конфигурация категорий
│   │   │   └── types/              # Типы данных
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── wb-api/                     # WB парсер (NestJS)
│   │   ├── src/
│   │   │   ├── parser/             # Парсер WildBerries
│   │   │   ├── grpc-server/        # gRPC сервер
│   │   │   ├── dto/                # DTO объекты
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── ozon-api/                   # Ozon парсер (Python)
│   │   ├── src/
│   │   │   ├── parsers/            # Парсер Ozon
│   │   │   ├── grpc/               # gRPC сервер
│   │   │   └── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── db-api/                     # API базы данных (NestJS)
│   │   ├── src/
│   │   │   ├── controllers/        # HTTP контроллеры
│   │   │   ├── services/           # Сервисы
│   │   │   ├── prisma/             # Prisma ORM
│   │   │   └── main.ts
│   │   ├── prisma/                 # Схема БД
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── marketvision-api/           # Веб-интерфейс (Next.js)
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router
│   │   │   │   ├── components/     # React компоненты
│   │   │   │   ├── hooks/          # React хуки
│   │   │   │   └── utils/          # Утилиты
│   │   │   └── types/              # TypeScript типы
│   │   ├── package.json
│   │   └── Dockerfile
│   │

│
├── docker-compose.yml              # Docker конфигурация
├── package.json                    # Корневой package.json
├── run-api.js                      # Скрипт запуска API
└── README.md                       # Документация
```

---

## ⚙️ Конфигурация

### Environment переменные:

```bash
# Product Filter Service
REDIS_URL=redis://redis:6379
GRPC_PORT=50051
GRPC_HOST=0.0.0.0
LOG_LEVEL=info

# WB API
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051
LOG_LEVEL=info

# Ozon API
NODE_ENV=production
PORT=3002
PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051
LOG_LEVEL=info

# DB API
DATABASE_URL=postgresql://user:password@postgres:5432/marketvision
PORT=3003
NODE_ENV=production

# MarketVision API
NODE_ENV=production
PORT=3004

# Telegram Bot
TG_BOT_TOKEN=your_bot_token
WB_API_URL=http://wb-api:3000
PRODUCT_FILTER_URL=http://product-filter-service:50051
REDIS_URL=redis://redis:6379

# PostgreSQL
POSTGRES_DB=marketvision
POSTGRES_USER=user
POSTGRES_PASSWORD=password
```

### Конфигурация категорий:

```typescript
// product-filter-service/src/config/categories.config.ts
export const CATEGORIES = {
  videocards: {
    ozon: 'videokarty-15721',
    wb: '3274',
    displayName: 'Видеокарты'
  },
  processors: {
    ozon: 'protsessory-15726', 
    wb: '3698',
    displayName: 'Процессоры'
  },
  motherboards: {
    ozon: 'materinskie-platy-15725',
    wb: '3699',
    displayName: 'Материнские платы'
  },
  // ... другие категории
};
```

---

## ✅ Система валидации

### Архитектура валидации V2:

Система использует унифицированный гибридный подход с AI/ML компонентами.

#### Компоненты:
- **UnifiedHybridValidator** - единый валидатор для всех категорий
- **ValidationConfigService** - конфигурация правил валидации
- **EnhancedPriceAnomalyService** - улучшенное обнаружение аномальных цен
- **UnifiedValidatorFactory** - фабрика валидаторов

#### Процесс валидации:
1. **Предфильтрация** - accessory-words, price-anomaly
2. **Code validation** - правила категории
3. **AI validation** - спорные случаи через AI
4. **Сборка результата** - финальная валидация

#### Добавление новой категории:

```typescript
// В validation.config.ts
new_category: {
  enabled: true,
  displayName: 'Новая категория',
  strictMode: false,
  rules: {
    requiredKeywords: ['keyword1', 'keyword2'],
    brands: ['brand1', 'brand2'],
    minFeatures: 2,
    minNameLength: 8
  },
  priceAnomaly: {
    enabled: true,
    minPercentageDifference: 0.3,
    maxSuspiciousPrice: 5000,
    zScoreThreshold: 2.0
  }
}
```



## 🧪 Тестирование

### Запуск в Docker:

```bash
# Полный запуск
docker-compose up -d

# Проверка статуса
docker-compose ps

# Тестирование сервисов:
# Product Filter Service (REST API)
curl http://localhost:3001/health
curl http://localhost:3001/products/search

# WB API (парсер WildBerries)
curl http://localhost:3006/health

# Ozon API (парсер Ozon)
curl http://localhost:3005/health
grpcurl -plaintext localhost:3002 list

# DB API (база данных)
curl http://localhost:3003/health

# MarketVision API (веб-интерфейс)
curl http://localhost:3004/api/service-status

# Product Filter Service (gRPC)
grpcurl -plaintext localhost:50051 list
```

### Локальная разработка:

```bash
# Запуск только инфраструктуры
docker-compose up redis postgres -d

# Запуск сервисов локально
cd monorepo-root/product-filter-service && npm run start:dev
cd monorepo-root/wb-api && npm run start:dev
cd monorepo-root/ozon-api && python src/main.py
cd monorepo-root/db-api && npm run start:dev
cd monorepo-root/marketvision-api && npm run dev
cd monorepo-root/bot && npm run dev
```

### Тестирование gRPC:

```bash
# Установка grpcurl
# Windows: choco install grpcurl
# Linux: apt install grpcurl

# Тест gRPC сервисов
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:3000 list
```

### Тестирование валидации:

```bash
# Тест новой системы валидации
cd monorepo-root/product-filter-service
npm run test:validation

# E2E тесты
npm run test:e2e
```

---

## 🐛 Отладка

### Просмотр логов:

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f product-filter-service
docker-compose logs -f wb-api
docker-compose logs -f ozon-api
docker-compose logs -f db-api
docker-compose logs -f marketvision-api

# Последние 100 строк
docker-compose logs --tail=100 [service-name]
```

### Проверка здоровья сервисов:

```bash
# Product Filter Service (REST API)
curl http://localhost:3001/health

# Product Filter Service (gRPC)
grpcurl -plaintext localhost:50051 list

# WB API (парсер WildBerries)
curl http://localhost:3006/health

# Ozon API (парсер Ozon)
curl http://localhost:3005/health
grpcurl -plaintext localhost:3002 list

# DB API (база данных)
curl http://localhost:3003/health

# MarketVision API (веб-интерфейс)
curl http://localhost:3004/api/service-status
```

### Отладка PostgreSQL:

```bash
# Подключение к PostgreSQL
docker exec -it postgres psql -U user -d marketvision

# Просмотр таблиц
\dt

# Просмотр данных
SELECT * FROM products LIMIT 10;
```

### Отладка Redis:

```bash
# Подключение к Redis
docker exec -it product-redis redis-cli

# Просмотр ключей
KEYS *

# Просмотр данных
GET "products:videocards:RTX4070"
```

### Часто встречающиеся проблемы:

| Проблема | Решение |
|----------|---------|
| `gRPC UNAVAILABLE` | Проверьте запущен ли product-filter-service |
| `Container не запускается` | Проверьте логи: `docker-compose logs [service]` |
| `PostgreSQL connection failed` | Убедитесь что PostgreSQL запущен |
| `Redis connection failed` | Убедитесь что Redis запущен |
| `Port already in use` | Остановите локальные сервисы или измените порты |
| `Port 3000 conflict` | WB API gRPC использует порт 3000, проверьте что не занят |
| `Port 3001 conflict` | Product Filter Service использует порт 3001, проверьте что не занят |
| `Port 3002 conflict` | Ozon API gRPC использует порт 3002, проверьте что не занят |
| `Port 3003 conflict` | DB API использует порт 3003, проверьте что не занят |
| `Port 3004 conflict` | MarketVision API использует порт 3004, проверьте что не занят |
| `Port 3005 conflict` | Ozon API HTTP health использует порт 3005, проверьте что не занят |
| `Port 3006 conflict` | WB API HTTP health использует порт 3006, проверьте что не занят |
| `Build failed` | Проверьте Dockerfile и зависимости |
| `Validation errors` | Проверьте конфигурацию валидации |

---

## 🎯 Best Practices

### ✅ Рекомендации:

1. **Всегда используйте Docker** для разработки и продакшена
2. **Тестируйте через Docker Compose** перед локальным запуском
3. **Используйте health checks** в Docker конфигурации
4. **Логируйте все операции** для отладки
5. **Кэшируйте данные** через Redis
6. **Используйте единый стандарт данных** (API-DATA-STANDARD.md)
7. **Добавляйте новые категории** через конфигурационные файлы
8. **Используйте систему валидации V2** для новых категорий

10. **Следите за метриками** производительности

### ❌ Чего избегать:

1. **Не подключайтесь к БД напрямую** из API сервисов
2. **Не хардкодите порты** в коде
3. **Не забывайте про health checks** в Docker
4. **Не используйте разные форматы данных** в разных API
5. **Не запускайте сервисы без Docker** в продакшене
6. **Не игнорируйте валидацию** товаров
7. **Не забывайте про миграции** базы данных

---

## 📚 Дополнительные ресурсы

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [gRPC Best Practices](https://grpc.io/docs/guides/best-practices/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Redis Commands](https://redis.io/commands)
- [API-DATA-STANDARD.md](./API-DATA-STANDARD.md)
- [VALIDATION_ARCHITECTURE_V2.md](./monorepo-root/product-filter-service/VALIDATION_ARCHITECTURE_V2.md)

---

**🎉 Happy Coding!** При возникновении вопросов обращайтесь к архитектору системы. 