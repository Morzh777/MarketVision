# Product-Filter-Service 🎯

**Центральный сервис** для агрегации и фильтрации товаров от WB API и Ozon API.

## 🏗️ Архитектура

```
Bot → Product-Filter-Service (HTTP API) → WB API + Ozon API (gRPC)
```

### 📦 Основные компоненты:

- **ProductsService** - основная логика агрегации и фильтрации
- **ProductsController** - HTTP API для бота
- **PhotoService** - обработка изображений WB API
- **RedisService** - кэширование цен
- **gRPC Clients** - связь с WB API и Ozon API

## 🚀 Запуск

```bash
# Установка зависимостей
npm install

# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## 📡 API Endpoints

### GET /products/search
Получение товаров по категории и запросам.

**Request:**
```json
{
  "queries": ["14900KF", "RTX4090"],
  "category": "processors",
  "exclude_keywords": []
}
```

**Response:**
```json
{
  "products": [
    {
      "id": "123",
      "name": "Intel Core i9-14900KF",
      "price": 45000,
      "image_url": "...",
      "product_url": "...",
      "category": "processors",
      "source": "wb",
      "query": "14900KF"
    }
  ],
  "total_queries": 2,
  "total_products": 1,
  "processing_time_ms": 150,
  "cache_hits": 0,
  "cache_misses": 1
}
```

## 🎯 Логика работы

1. **Получение данных** - параллельные запросы к WB API и Ozon API
2. **Валидация** - проверка соответствия товаров запросам
3. **Группировка** - группировка по модели и выбор самого дешевого
4. **Кэширование** - сравнение с кэшем, возврат только лучших цен
5. **Возврат** - отсортированный результат для бота

## 🔧 Конфигурация

### Переменные окружения:
- `REDIS_URL` - URL Redis для кэширования
- `WB_API_URL` - URL WB API gRPC сервиса
- `OZON_API_URL` - URL Ozon API gRPC сервиса

## 📊 Мониторинг

- Логирование всех операций
- Метрики производительности
- Статистика кэша (hits/misses)
- Время обработки запросов

## 🧪 Тестирование

```bash
# Запуск тестов
npm run test

# Тестирование интеграции
node tests/test-validation-detailed.js
```

## 🛠️ Технологии

- **Node.js** + **TypeScript**
- **gRPC** (@grpc/grpc-js)
- **Protocol Buffers** для схемы данных
- **Redis** для кэширования
- **Winston** для логирования
- **Docker** для контейнеризации

## 🐳 Docker

### Сборка образа
```bash
docker build -t product-filter-service .
```

### Запуск контейнера
```bash
docker run -p 50051:50051 \
  -e REDIS_URL=redis://localhost:6379 \
  product-filter-service
```

### Запуск всей системы
```bash
docker-compose up -d
```

## 📡 gRPC API

### Методы сервиса

#### 1. FilterProducts
Фильтрует массив продуктов по заданным правилам
```protobuf
rpc FilterProducts(FilterProductsRequest) returns (FilterProductsResponse);
```

#### 2. CacheProducts
Кэширует обработанные продукты в Redis
```protobuf
rpc CacheProducts(CacheProductsRequest) returns (CacheProductsResponse);
```

#### 3. GetCachedProducts
Получает продукты из кэша
```protobuf
rpc GetCachedProducts(GetCachedProductsRequest) returns (GetCachedProductsResponse);
```

#### 4. ClearCache
Очищает кэш по паттерну
```protobuf
rpc ClearCache(ClearCacheRequest) returns (ClearCacheResponse);
```

## 🔧 Конфигурация фильтров

### X3D правила (для процессоров)
```typescript
{
  x3d_rules: {
    enabled: true,
    max_position_in_title: 30,     // X3D должен быть в первых 30 символах
    strict_model_match: true       // Точное соответствие модели (7800 ≠ 7600)
  }
}
```

### Chipset правила (для материнских плат)
```typescript
{
  chipset_rules: {
    enabled: true,
    validate_chipset_format: true,  // Проверка формата чипсета
    require_brand_match: true       // Требование соответствия бренда
  }
}
```

### RTX правила (для видеокарт)
```typescript
{
  rtx_rules: {
    enabled: true,
    strict_model_match: true,       // Точное соответствие модели
    require_rtx_prefix: true        // Требование префикса RTX/GTX/RX
  }
}
```

## 📊 Пример использования

### TypeScript/Node.js клиент
```typescript
import { ProductFilterClient } from './grpc-clients/product-filter.client';

const client = new ProductFilterClient('localhost:50051');

const result = await client.filterProducts(
  rawProducts,
  '7800x3d',
  {
    x3d_rules: {
      enabled: true,
      max_position_in_title: 30,
      strict_model_match: true
    }
  },
  {
    excludeKeywords: ['материнская', 'ноутбук'],
    source: 'wb',
    category: 'cpus'
  }
);

console.log(`✅ Отфильтровано: ${result.totalFiltered}/${result.totalInput} за ${result.processingTimeMs}мс`);
```

### Python клиент
```python
import grpc
from product_pb2_grpc import ProductFilterServiceStub
from product_pb2 import FilterProductsRequest

channel = grpc.insecure_channel('localhost:50051')
client = ProductFilterServiceStub(channel)

request = FilterProductsRequest(
    products=raw_products,
    query='7800x3d',
    config=FilterConfig(
        x3d_rules=X3DRules(
            enabled=True,
            max_position_in_title=30,
            strict_model_match=True
        )
    )
)

response = client.FilterProducts(request)
print(f"✅ Отфильтровано: {response.total_filtered}/{response.total_input}")
```

## 🔍 Валидаторы

### X3DValidator
- Поддерживает различные форматы: `7800x3d`, `7800 x3d`, `7800X3D`
- Поддерживает кириллицу: `7800х3d` (русская 'х')
- Точное соответствие модели: `7800` ≠ `7600`
- Проверка позиции в названии

### ChipsetValidator
- Intel: `B760`, `H770`, `Z790` с суффиксами
- AMD: `A620`, `B650`, `X670`, `X670E`
- Гибкие форматы: `Z790E`, `Z790-E`, `Z790_E`

### RTXValidator
- NVIDIA: `RTX`, `GTX` с моделями
- AMD: `RX` с моделями и суффиксом `XT`
- Поддержка слитного написания: `RTX4090`
- Суффиксы: `Ti`, `Super`, `XT`

## 📈 Производительность

### Преимущества gRPC над REST:
- **3-5x быстрее** передача данных
- **Бинарная сериализация** Protocol Buffers
- **HTTP/2** мультиплексирование
- **Streaming** поддержка
- **Строгая типизация** схемы

### Бенчмарки:
- Фильтрация 1000 продуктов: **~50-100мс**
- Передача данных: **~10-20мс** (vs REST ~50-100мс)
- Кэширование: **~1-5мс**

## 🌍 Переменные окружения

```bash
# gRPC сервер
GRPC_PORT=50051
GRPC_HOST=0.0.0.0

# Redis
REDIS_URL=redis://localhost:6379

# Логирование
LOG_LEVEL=info
```

## 📝 Логи

Логи сохраняются в директории `logs/`:
- `error.log` - только ошибки
- `combined.log` - все логи
- Консольный вывод с цветами

## 🔄 Масштабирование

### Горизонтальное масштабирование:
```yaml
# docker-compose.yml
product-filter-service:
  deploy:
    replicas: 3
  ports:
    - "50051-50053:50051"
```

### Load Balancing:
```yaml
# nginx.conf
upstream grpc_backend {
    server product-filter-service-1:50051;
    server product-filter-service-2:50051;
    server product-filter-service-3:50051;
}
```

## 🚀 Будущие возможности

- [ ] **Streaming API** для больших объемов данных
- [ ] **Metrics** с Prometheus
- [ ] **Health checks** и readiness probes
- [ ] **Circuit breaker** для устойчивости
- [ ] **Rate limiting** для защиты от перегрузок
- [ ] **A/B тестирование** правил фильтрации

---

**Результат**: Единый высокопроизводительный микросервис, который централизует всю логику фильтрации и кэширования, обеспечивая быстрое взаимодействие между всеми API сервисами через gRPC протокол! 🎯 