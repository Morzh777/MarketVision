# 🚀 Руководство разработчика WBInfo

## 📋 Содержание

1. [🏗️ Архитектура системы](#️-архитектура-системы)
2. [🐳 Docker и развертывание](#-docker-и-развертывание)
3. [➕ Добавление новых сервисов парсинга](#-добавление-новых-сервисов-парсинга)
4. [🔗 Подключение gRPC Cache](#-подключение-grpc-cache)
5. [📁 Структура проекта](#-структура-проекта)
6. [⚙️ Конфигурация](#️-конфигурация)
7. [🧪 Тестирование](#-тестирование)
8. [🐛 Отладка](#-отладка)

---

## 🏗️ Архитектура системы

### Финальная архитектура:
```
Telegram Bot (Node.js)
    ↓ HTTP
Product-Filter-Service (NestJS, порт 3001) ←→ Redis
    ↓ gRPC
WB-API (NestJS, порт 3000) → WildBerries
Ozon-API (Python, порт 3002) → Ozon
```

### Ключевые принципы:
- ✅ **Product-Filter-Service** - центральный hub для агрегации данных
- ✅ **Единый gRPC Cache** через Redis для всех данных
- ✅ **Микросервисная архитектура** с четким разделением ответственности
- ✅ **Docker контейнеры** для всех сервисов
- ✅ **Nginx** для маршрутизации и балансировки нагрузки

### Планируемая архитектура с Nginx:
```
Nginx (порт 80/443)
    ↓ маршрутизация
├── Product-Filter-Service (порт 3001) - основной API
├── WB-API (порт 3000) - парсинг WildBerries  
├── Ozon-API (порт 3002) - парсинг Ozon
└── Telegram Bot (порт 3003) - бот интерфейс
```

---

## 🐳 Docker и развертывание

### Текущая конфигурация Docker Compose:

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    
  product-filter-service:
    build: ./monorepo-root/product-filter-service
    ports: ["50051:50051"]
    
  wb-api:
    build: ./monorepo-root/wb-api
    ports: ["3000:3000"]
    
  ozon-api:
    build: ./monorepo-root/ozon-api
    ports: ["3002:3002"]
    
  telegram-bot:
    build: ./monorepo-root/bot
    environment:
      - WB_API_URL=http://wb-api:3000
      - OZON_API_URL=http://ozon-api:3002
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

# Очистка данных Redis
docker-compose down -v
```

### Планируемая конфигурация с Nginx:

```yaml
# nginx.conf (будет добавлен)
server {
    listen 80;
    server_name wbinfo.local;
    
    # Product Filter Service (основной API)
    location /api/ {
        proxy_pass http://product-filter-service:3001/;
    }
    
    # WB API
    location /wb/ {
        proxy_pass http://wb-api:3000/;
    }
    
    # Ozon API  
    location /ozon/ {
        proxy_pass http://ozon-api:3002/;
    }
    
    # Telegram Bot Webhook
    location /bot/ {
        proxy_pass http://telegram-bot:3003/;
    }
}
```

---

## ➕ Добавление новых сервисов парсинга

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
  depends_on:
    - product-filter-service
  networks:
    - product-network
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

## 🔗 Подключение gRPC Cache

### Product-Filter-Service как центральный hub:

```typescript
// product-filter-service/src/services/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    private readonly wbApiClient: WbApiClient,
    private readonly ozonApiClient: OzonApiClient,
    private readonly redisService: RedisService
  ) {}

  async getProducts(query: string, category: string) {
    // 1. Проверяем кэш
    const cached = await this.redisService.get(`products:${category}:${query}`);
    if (cached) return cached;

    // 2. Запрашиваем данные от всех API
    const [wbProducts, ozonProducts] = await Promise.all([
      this.wbApiClient.filterProducts({ query, category }),
      this.ozonApiClient.filterProducts({ query, category })
    ]);

    // 3. Агрегируем и фильтруем
    const allProducts = [...wbProducts, ...ozonProducts];
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
| `photos:category:product_id` | Фотографии товаров | 24 часа |

---

## 📁 Структура проекта

```
wbinfo/
├── monorepo-root/
│   ├── bot/                        # Telegram бот (Node.js)
│   │   ├── src/
│   │   │   ├── commands/           # Команды бота
│   │   │   ├── services/           # Сервисы
│   │   │   └── main.ts
│   │   └── Dockerfile
│   │
│   ├── product-filter-service/     # Центральный API (NestJS)
│   │   ├── src/
│   │   │   ├── controllers/        # HTTP контроллеры
│   │   │   ├── services/           # Бизнес-логика
│   │   │   ├── grpc-clients/       # gRPC клиенты к API
│   │   │   └── config/             # Конфигурация категорий
│   │   └── Dockerfile
│   │
│   ├── wb-api/                     # WB парсер (NestJS)
│   │   ├── src/
│   │   │   ├── parser/             # Парсер WildBerries
│   │   │   ├── grpc-server/        # gRPC сервер
│   │   │   └── main.ts
│   │   └── Dockerfile
│   │
│   └── ozon-api/                   # Ozon парсер (Python)
│       ├── src/
│       │   ├── parsers/            # Парсер Ozon
│       │   ├── grpc/               # gRPC сервер
│       │   └── main.py
│       └── Dockerfile
│
├── docker-compose.yml              # Docker конфигурация
├── nginx/                          # Nginx конфигурация (планируется)
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

# WB API
NODE_ENV=production
PORT=3000
PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051

# Ozon API
REDIS_URL=redis://redis:6379
PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051

# Telegram Bot
TG_BOT_TOKEN=your_bot_token
WB_API_URL=http://wb-api:3000
OZON_API_URL=http://ozon-api:3002
```

### Конфигурация категорий:

```typescript
// product-filter-service/src/config/categories.config.ts
export const CATEGORIES = {
  videocards: {
    ozon: 'videokarty-15721',
    wb: '3274'
  },
  processors: {
    ozon: 'protsessory-15726', 
    wb: '3698'
  },
  // ... другие категории
};
```

---

## 🧪 Тестирование

### Запуск в Docker:

```bash
# Полный запуск
docker-compose up -d

# Проверка статуса
docker-compose ps

# Тестирование API
curl http://localhost:3001/api/products?query=RTX4070&category=videocards

# Тестирование WB API
curl http://localhost:3000/parser/videocards

# Тестирование Ozon API
curl http://localhost:3002/parser/videocards
```

### Локальная разработка:

```bash
# Запуск только Redis
docker-compose up redis -d

# Запуск сервисов локально
cd monorepo-root/product-filter-service && npm run start:dev
cd monorepo-root/wb-api && npm run start:dev
cd monorepo-root/ozon-api && python src/main.py
```

### Тестирование gRPC:

```bash
# Установка grpcurl
# Windows: choco install grpcurl
# Linux: apt install grpcurl

# Тест gRPC сервисов
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:3000 list
grpcurl -plaintext localhost:3002 list
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

# Последние 100 строк
docker-compose logs --tail=100 [service-name]
```

### Проверка здоровья сервисов:

```bash
# Product Filter Service
curl http://localhost:3001/health

# WB API
curl http://localhost:3000/health

# Ozon API
curl http://localhost:3002/health
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
| `Redis connection failed` | Убедитесь что Redis запущен: `docker-compose up redis -d` |
| `Port already in use` | Остановите локальные сервисы или измените порты |
| `Build failed` | Проверьте Dockerfile и зависимости |

---

## 🎯 Best Practices

### ✅ Рекомендации:

1. **Всегда используйте Docker** для разработки и продакшена
2. **Тестируйте через Docker Compose** перед локальным запуском
3. **Используйте health checks** в Docker конфигурации
4. **Логируйте все операции** для отладки
5. **Кэшируйте данные** через Redis
6. **Используйте единый стандарт данных** (PARSER-DATA-STANDARD.md)
7. **Добавляйте новые категории** через конфигурационные файлы

### ❌ Чего избегать:

1. **Не подключайтесь к Redis напрямую** из API сервисов
2. **Не хардкодите порты** в коде
3. **Не забывайте про health checks** в Docker
4. **Не используйте разные форматы данных** в разных API
5. **Не запускайте сервисы без Docker** в продакшене

---

## 📚 Дополнительные ресурсы

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [gRPC Best Practices](https://grpc.io/docs/guides/best-practices/)
- [Redis Commands](https://redis.io/commands)
- [PARSER-DATA-STANDARD.md](./PARSER-DATA-STANDARD.md)

---

**🎉 Happy Coding!** При возникновении вопросов обращайтесь к архитектору системы. 