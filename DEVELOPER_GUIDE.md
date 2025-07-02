# 🚀 Руководство разработчика WBInfo

## 📋 Содержание

1. [🏗️ Архитектура системы](#️-архитектура-системы)
2. [➕ Добавление новых сервисов парсинга](#-добавление-новых-сервисов-парсинга)
3. [🔗 Подключение gRPC Cache](#-подключение-grpc-cache)
4. [📁 Структура проекта](#-структура-проекта)
5. [⚙️ Конфигурация](#️-конфигурация)
6. [🧪 Тестирование](#-тестирование)
7. [🐛 Отладка](#-отладка)

---

## 🏗️ Архитектура системы

### Общая схема:
```
WB-API (NestJS) ←→ gRPC ←→ Product-Filter-Service (NestJS) ←→ Redis (внутренний)
     ↑                                    ↑
Bot Service                         Валидаторы + Фильтры + Кэш
```

### ⚠️ **ВАЖНО:**
- **WB-API НЕ ПОДКЛЮЧАЕТСЯ** к Redis напрямую
- **Только Product-Filter-Service** управляет Redis
- **Весь кэш** (цены, фото, фильтры) - через gRPC

### Ключевые принципы:
- ✅ **Единый gRPC Cache** для всех данных (цены, фотографии, фильтры)
- ✅ **Микросервисная архитектура** с четким разделением ответственности
- ✅ **Постоянное хранение** данных (TTL = 0 для истории)
- ✅ **Fallback механизмы** при недоступности сервисов

---

## ➕ Добавление новых сервисов парсинга

### Шаг 1: Создание базового сервиса

Создайте новый файл `monorepo-root/wb-api/src/parser/application/services/[category].service.ts`:

**💡 Пример:** `processors` → `parser/processors`, `videocards` → `parser/videocards`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { BaseParserService } from './base-parser.service';
import { FilterConfigPresets } from '../../domain/filter/entities/filter-config.entity';
import { IProductFilterService } from '../../domain/filter/interfaces/filter.interfaces';
import { WildberriesApiClient, PhotoService } from '../../domain/interfaces/wb-api.interface';
import { PRODUCT_FILTER_SERVICE } from '../../domain/filter/filter.module';
import { WB_API_CLIENT, PHOTO_SERVICE } from '../../infrastructure/infrastructure.module';

@Injectable()
export class NewCategoryService extends BaseParserService {
  // Поисковые запросы для вашей категории
  protected readonly TEST_QUERIES = [
    'запрос1', 'запрос2', 'запрос3'
  ];
  
  // xsubject код категории в WB API
  protected readonly TEST_XSUBJECT = 1234; // Найдите код для вашей категории
  
  // Ключевые слова для исключения
  protected readonly EXCLUDE_KEYWORDS = [
    'исключить1', 'исключить2'
  ];

  // Конфигурация фильтров (создайте новую в FilterConfigPresets)
  protected readonly FILTER_CONFIG = FilterConfigPresets.NEW_CATEGORY_CONFIG;

  // Название категории для кэша
  protected get category(): string { return 'new_category'; }

  constructor(
    @Inject(PRODUCT_FILTER_SERVICE) 
    filterService: IProductFilterService,
    @Inject(WB_API_CLIENT)
    wbApiClient: WildberriesApiClient,
    @Inject(PHOTO_SERVICE)
    photoService: PhotoService
  ) {
    super(filterService, wbApiClient, photoService);
    this.initCaches();
  }

  // Публичный метод для контроллера с gRPC интеграцией
  async findAllNewCategory() {
    return this.findAllProductsViaGrpc();
  }
}
```

### Шаг 2: Создание контроллера

Создайте `monorepo-root/wb-api/src/parser/presentation/controllers/[category].controller.ts`:

```typescript
import { Controller, Get, Req } from '@nestjs/common';
import { NewCategoryService } from '../../application/services/new-category.service';
import { BaseRateLimitedController } from '../rate-limit/base-rate-limited.controller';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { Request } from 'express';
import { ProcessedProduct } from '../../../grpc-clients/product-filter.client';

interface GrpcFilterResult {
  query: string;
  products: ProcessedProduct[];
  stats: {
    totalInput: number;
    totalFiltered: number;
    processingTimeMs: number;
  };
}

@Controller('parser/new-category')
export class NewCategoryController extends BaseRateLimitedController {
    constructor(
        private readonly newCategoryService: NewCategoryService,
        protected readonly rateLimitService: RateLimitService
    ) { super(rateLimitService); }

    @Get()
    async findAllNewCategory(@Req() req: Request): Promise<GrpcFilterResult[]> {
        return this.rateLimited(req.ip || 'unknown', () => this.newCategoryService.findAllNewCategory());
    }

    @Get('legacy')
    async findAllNewCategoryLegacy(@Req() req: Request) {
        return this.rateLimited(req.ip || 'unknown', () => this.newCategoryService.findAllProducts());
    }
}
```

### Шаг 3: Добавление в модули

Обновите `monorepo-root/wb-api/src/parser/parser.module.ts`:

```typescript
import { NewCategoryService } from './application/services/new-category.service';
import { NewCategoryController } from './presentation/controllers/new-category.controller';

@Module({
  imports: [/* ... */],
  controllers: [
    // ... существующие контроллеры
    NewCategoryController,
  ],
  providers: [
    // ... существующие сервисы
    NewCategoryService,
  ],
})
export class ParserModule {}
```

### Шаг 4: Конфигурация фильтров

Добавьте в `monorepo-root/wb-api/src/parser/domain/filter/entities/filter-config.entity.ts`:

```typescript
export class FilterConfigPresets {
  // ... существующие конфиги
  
  static readonly NEW_CATEGORY_CONFIG: FilterConfig = {
    x3dRules: {
      enabled: false, // Настройте под вашу категорию
    },
    chipsetRules: {
      enabled: true,
      validateChipsetFormat: true,
      requireBrandMatch: true,
    },
    rtxRules: {
      enabled: false,
    }
  };
}
```

---

## 🔗 Подключение gRPC Cache

### BaseParserService уже включает gRPC!

Все сервисы, наследующие от `BaseParserService`, автоматически получают доступ к gRPC Cache через `this.grpcClient`.

### Основные методы gRPC Cache:

#### 💾 Сохранение данных:
```typescript
// Сохранение цен (навсегда, TTL = 0)
await this.grpcClient.cacheProducts(
  'price:new_category:product_stable_id',
  [{
    id: product.id.toString(),
    name: product.name,
    price: currentPrice,
    category: 'new_category',
    // ... остальные поля
  }],
  0 // TTL = 0 = навсегда
);

// Сохранение последней опубликованной цены
await this.grpcClient.cacheProducts(
  'last_posted_price:new_category:product_stable_id',
  [/* данные */],
  0
);
```

#### 📷 Кэширование фотографий:
```typescript
// Фотографии автоматически кэшируются в BaseParserService
// Категория передается из this.category в PhotoService
const photoUrl = await this.photoService.getProductPhoto(product, this.category);

// Ключ кэша: new_category:product_id
// Структура: {category}:{product_id}
```

#### 📖 Получение данных:
```typescript
// Получение из кэша
const cachedData = await this.grpcClient.getCachedProducts('price:new_category:product_id');

if (cachedData.found && cachedData.products.length > 0) {
  const lastPrice = cachedData.products[0].price;
  // Логика сравнения цен...
}
```

#### 🔍 Фильтрация товаров:
```typescript
const result = await this.grpcClient.filterProducts(
  rawProducts,           // Массив товаров с WB
  query,                // Поисковый запрос
  this.getGrpcFilterConfig(), // Конфигурация фильтров
  {
    excludeKeywords: this.EXCLUDE_KEYWORDS,
    source: 'wb',
    category: this.category
  }
);
```

### Структура ключей кэша:

| Тип данных | Ключ | Описание |
|------------|------|----------|
| 💰 Цены | `price:category:stable_id` | История всех цен товара |
| 📝 Посты | `last_posted_price:category:stable_id` | Последняя опубликованная цена |
| 📷 Фото | `category:product_id` | Фотографии товаров |
| 🔍 Фильтры | `filter:category:config_hash` | Настройки фильтров |

---

## 📁 Структура проекта

```
wbinfo/
├── monorepo-root/
│   ├── wb-api/                     # Основное API (NestJS)
│   │   ├── src/
│   │   │   ├── parser/
│   │   │   │   ├── application/services/    # Бизнес-логика парсинга
│   │   │   │   ├── presentation/controllers/ # HTTP эндпоинты
│   │   │   │   ├── domain/                  # Доменная логика и интерфейсы
│   │   │   │   └── infrastructure/         # Внешние сервисы (API, фото)
│   │   │   ├── grpc-clients/               # gRPC клиенты
│   │   │   └── main.ts
│   │   └── proto/product.proto             # gRPC интерфейс
│   │
│   ├── product-filter-service/     # gRPC микросервис (NestJS)
│   │   ├── src/
│   │   │   ├── controllers/               # gRPC контроллеры
│   │   │   ├── services/                  # Бизнес-логика фильтрации
│   │   │   ├── validators/                # Валидаторы товаров
│   │   │   └── main.ts
│   │   └── proto/product.proto           # gRPC интерфейс (копия)
│   │
│   └── bot/                        # Telegram бот
│       └── src/services/
│
├── docker-compose.yml              # Контейнеры для разработки
└── README.md                       # Общая документация
```

---

## ⚙️ Конфигурация

### Environment переменные (.env):

```bash
# WB API Service
NODE_ENV=development
PORT=3000
PRODUCT_FILTER_SERVICE_URL=localhost:50051
GRPC_USE_SSL=false
GRPC_FALLBACK_ENABLED=true

# Product Filter Service  
GRPC_HOST=0.0.0.0
GRPC_PORT=50051
REDIS_URL=redis://localhost:6379

# Bot Service
TG_BOT_TOKEN=your_bot_token
WB_API_URL=http://localhost:3000
```

### Docker Compose для разработки:

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  product-filter-service:
    build: ./monorepo-root/product-filter-service
    ports:
      - "50051:50051"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  wb-api:
    build: ./monorepo-root/wb-api
    ports:
      - "3000:3000"
    environment:
      - PRODUCT_FILTER_SERVICE_URL=product-filter-service:50051
    depends_on:
      - product-filter-service

volumes:
  redis_data:
```

---

## 🧪 Тестирование

### Запуск всех сервисов:

```bash
# 1. Запуск Redis
docker run -d -p 6379:6379 redis:7-alpine

# 2. Запуск Product Filter Service
cd monorepo-root/product-filter-service
npm run start:dev

# 3. Запуск WB API
cd monorepo-root/wb-api  
npm run start:dev

# 4. Тестирование нового эндпоинта
curl http://localhost:3000/parser/new-category
```

### Проверка gRPC соединения:

```bash
# Установка grpcurl для тестирования
# Windows: choco install grpcurl
# Linux: apt install grpcurl

# Тест подключения к gRPC
grpcurl -plaintext localhost:50051 list

# Тест кэширования
grpcurl -plaintext -d '{"cache_key":"test","products":[],"ttl_seconds":0}' \
  localhost:50051 product_filter.ProductFilterService/CacheProducts
```

---

## 🐛 Отладка

### Логи gRPC:

```typescript
// В ProductFilterClient включено автоматическое логирование:
// ✅ gRPC запрос выполнен за 150мс
// ❌ gRPC ошибка (2000мс): UNAVAILABLE

// Для детального дебага добавьте:
console.log('🔗 gRPC клиент подключен к', serverAddress);
```

### Проверка gRPC кэша:

```bash
# Обновление кэша фотографий через API
node refresh-photos-cache.js

# Проверка конкретной категории через API
curl http://localhost:3000/parser/videocards
curl http://localhost:3000/parser/processors  
curl http://localhost:3000/parser/motherboards

# Проверка здоровья сервисов
curl http://localhost:3000/health
```

### Часто встречающиеся проблемы:

| Проблема | Решение |
|----------|---------|
| `gRPC UNAVAILABLE` | Проверьте запущен ли product-filter-service на порту 50051 |
| `WB-API недоступен` | Запустите: `docker-compose up wb-api -d` |
| `Proto file not found` | Проверьте что proto файлы синхронны в обоих сервисах |
| `Fallback mode activated` | gRPC сервис недоступен, проверьте логи product-filter-service |
| `Фотографий не найдено` | Проверьте подключение к WildBerries и gRPC кэш |

---

## 🎯 Best Practices

### ✅ Рекомендации:

1. **Всегда используйте TTL = 0** для исторических данных (цены, фото)
2. **Создавайте уникальные stable_id** для товаров (без спецсимволов)
3. **Правильно устанавливайте `this.category`** в наследующем сервисе
4. **Добавляйте fallback логику** для критических операций
5. **Логируйте все gRPC операции** для отладки
6. **Тестируйте с реальными данными** WB API
7. **Фотографии кэшируются автоматически** по категории из BaseParserService

### ❌ Чего избегать:

1. **❌ НИКОГДА не подключайтесь к Redis напрямую из WB-API** - только через gRPC!
2. Не используйте TTL для постоянных данных (цены, фото)
3. Не дублируйте логику кэширования в разных сервисах
4. Не забывайте вызывать `grpcClient.close()` при завершении
5. **НЕ ПРАВЬТЕ PhotoService** при добавлении новых категорий - категория передается автоматически!
6. **НЕ СОЗДАВАЙТЕ** скрипты прямого доступа к Redis - только через API!

---

## 📚 Дополнительные ресурсы

- [NestJS gRPC Documentation](https://docs.nestjs.com/microservices/grpc)
- [Protocol Buffers Guide](https://developers.google.com/protocol-buffers)
- [Redis Commands Reference](https://redis.io/commands)
- [WB API Documentation](внутренняя документация)

---

**🎉 Happy Coding!** При возникновении вопросов обращайтесь к архитектору системы. 