# PARSER-DATA-STANDARD.md

## Унифицированный стандарт данных для парсеров

Этот документ описывает унифицированный формат данных, который должны возвращать все парсеры (WB API, Ozon API, Yandex Market API) для передачи в Product-Filter-Service.

## 🏗️ Архитектура системы

```
┌─────────────────┐    HTTP     ┌─────────────────────┐    gRPC     ┌─────────────────┐
│     Клиент      │ ──────────► │ Product-Filter-     │ ──────────► │   WB API        │
│   (Telegram)    │             │ Service             │             │   (NestJS)      │
│                 │             │ (gRPC Server)       │             │   Port: 3000    │
└─────────────────┘             │ Port: 50051         │             └─────────────────┘
                                │                     │
                                │                     │    gRPC     ┌─────────────────┐
                                │                     │ ──────────► │   Ozon API      │
                                │                     │             │   (Python)      │
                                │                     │             │   Port: 3002    │
                                │                     │             └─────────────────┘
                                │                     │
                                │                     │    gRPC     ┌─────────────────┐
                                │                     │ ──────────► │   Yandex API    │
                                │                     │             │   (Python)      │
                                │                     │             │   Port: 3003    │
                                │                     │             └─────────────────┘
                                │                     │                                │                     │
                                │                     │    Redis    ┌─────────────────┐
                                │                     │ ──────────► │   Cache         │
                                │                     │             │   Port: 6379    │
                                │                     │             └─────────────────┘
                                │                     │
                                └─────────────────────┘
```

## 📡 Протоколы взаимодействия

### 1. Клиент ↔ Product-Filter-Service
- **Протокол**: HTTP REST API
- **Порт**: 50051 (gRPC)
- **Endpoints**:
  - `GET /api/v1/products?query=rtx 5080`
  - `GET /api/v1/health`

### 2. Product-Filter-Service ↔ Парсеры
- **Протокол**: gRPC
- **Ozon API**: localhost:3002
- **WB API**: localhost:3000
- **Yandex API**: localhost:3003

### 3. Поток данных
1. **Клиент** делает HTTP запрос к Product-Filter-Service
2. **Product-Filter-Service** делает gRPC запросы ко всем парсерам
3. **Парсеры** возвращают сырые данные в едином формате
4. **Product-Filter-Service** агрегирует, фильтрует и кэширует данные
5. **Product-Filter-Service** возвращает результат клиенту

## 🔧 Технологический стек

### Product-Filter-Service (Центральный сервис)
- **Язык**: TypeScript/Node.js
- **Фреймворк**: NestJS
- **Протокол**: gRPC (сервер) + HTTP (клиент)
- **Кэширование**: Redis
- **Порт**: 50051 (gRPC), 3001 (HTTP)

### WB API (WildBerries)
- **Язык**: TypeScript/Node.js
- **Фреймворк**: NestJS
- **Протокол**: gRPC (сервер)
- **Парсинг**: Puppeteer/Playwright
- **Порт**: 3000

### Ozon API
- **Язык**: Python
- **Фреймворк**: gRPC
- **Парсинг**: Selenium + undetected-chromedriver
- **Порт**: 3002

### Yandex API
- **Язык**: Python
- **Фреймворк**: gRPC
- **Парсинг**: Selenium + undetected-chromedriver
- **Порт**: 3003

## 🚀 Запуск и тестирование

### Запуск Ozon API
```bash
cd monorepo-root/ozon-api
pip install -r requirements.txt
python build_proto.py  # Генерация gRPC кода
python src/main.py     # Запуск HTTP сервера на порту 3001
```

### Запуск WB API
```bash
cd monorepo-root/wb-api
npm install
npm run start:dev  # Запуск HTTP сервера на порту 3000
```

### Запуск Product-Filter-Service
```bash
cd monorepo-root/product-filter-service
npm install
npm run start:dev  # Запуск HTTP и gRPC серверов
```

### Тестирование API
```bash
# Ozon API
curl http://localhost:3001/api/v1/products
curl http://localhost:3001/api/v1/health

# WB API
curl http://localhost:3000/parser/videocards
curl http://localhost:3000/parser/cpus

# Product-Filter-Service
curl http://localhost:3003/health
```

## 📝 Примеры для разных источников

### Wildberries API

```json
{
  "query": "rtx 4070 super",
  "products": [
    {
      "id": "218737525",
      "name": "Видеокарта игровая NVIDIA GeForce RTX 4070 SUPER",
      "price": 67924,
      "description": "",
      "image_url": "https://images.wbstatic.net/c516x688/218737525.jpg",
      "product_url": "https://www.wildberries.ru/catalog/218737525/detail.aspx",
      "images": ["https://images.wbstatic.net/c516x688/218737525.jpg"],
      "characteristics": {
        "brand": "KFA2",
        "supplier": "Wildberries"
      },
      "category": "videocards",
      "availability": "available",
      "supplier": "Wildberries",
      "source": "wb"
    }
  ],
  "stats": {
    "totalInput": 15,
    "totalFiltered": 1,
    "processingTimeMs": 150
  }
}
```

### Ozon API

```json
{
  "query": "rtx 4060 ti",
  "products": [
    {
      "id": "2245838324",
      "name": "GALAX Видеокарта GeForce RTX 4060 Ti 8 ГБ",
      "price": 41471,
      "description": "",
      "image_url": "https://cdn1.ozone.ru/s3/multimedia-1-y/7599286942.jpg",
      "product_url": "https://www.ozon.ru/product/galax-videokarta-geforce-rtx-4060-ti-8-gb-489514757146-2245838324/",
      "images": ["https://cdn1.ozone.ru/s3/multimedia-1-y/7599286942.jpg"],
      "characteristics": {
        "brand": "GALAX",
        "old_price": "48000",
        "discount": "−13%",
        "delivery": "7 июля",
        "is_premium_seller": "false"
      },
      "category": "videocards",
      "availability": "available",
      "supplier": "Ozon",
      "source": "ozon"
    }
  ],
  "stats": {
    "totalInput": 8,
    "totalFiltered": 1,
    "processingTimeMs": 200
  }
}
```

### Yandex Market API

```json
{
  "query": "rtx 5080",
  "products": [
    {
      "id": "123456789",
      "name": "ZOTAC Видеокарта GeForce RTX 5080 16 ГБ",
      "price": 117026,
      "description": "Новая игровая видеокарта",
      "image_url": "https://example.com/image.jpg",
      "product_url": "https://market.yandex.ru/product/123456789",
      "images": ["https://example.com/image.jpg"],
      "characteristics": {
        "brand": "ZOTAC",
        "old_price": "235999",
        "discount": "−50%",
        "rating": "4.7",
        "reviews_count": "31"
      },
      "category": "videocards",
      "availability": "available",
      "supplier": "Yandex Market",
      "source": "yandex"
    }
  ],
  "stats": {
    "totalInput": 12,
    "totalFiltered": 1,
    "processingTimeMs": 180
  }
}
```

## 🏷️ Категории товаров

| Категория | Описание | xsubject (WB) |
|-----------|----------|---------------|
| `videocards` | Видеокарты | `3274` |
| `processors` | Процессоры | `3698` |
| `motherboards` | Материнские платы | `3690` |

## 📡 Источники данных

| Источник | Значение | Описание |
|----------|----------|----------|
| Wildberries | `"wb"` | Данные с Wildberries API |
| Ozon | `"ozon"` | Данные с Ozon API |
| Yandex Market | `"yandex"` | Данные с Yandex Market API |

## ✅ Статусы наличия

| Статус | Описание |
|--------|----------|
| `"available"` | Товар в наличии |
| `"out_of_stock"` | Товар отсутствует |

## 🔍 gRPC интерфейс

### Product-Filter-Service методы

```protobuf
service ProductFilterService {
  // Фильтрация продуктов
  rpc FilterProducts(FilterProductsRequest) returns (FilterProductsResponse);
  
  // Кэширование результатов
  rpc CacheProducts(CacheProductsRequest) returns (CacheProductsResponse);
  
  // Получение из кэша
  rpc GetCachedProducts(GetCachedProductsRequest) returns (GetCachedProductsResponse);
  
  // Очистка кэша
  rpc ClearCache(ClearCacheRequest) returns (ClearCacheResponse);
}
```

### Конфигурация фильтров

```protobuf
message FilterConfig {
  X3DRules x3d_rules = 1;
  ChipsetRules chipset_rules = 2;
  RTXRules rtx_rules = 3;
}

message RTXRules {
  bool enabled = 1;
  bool strict_model_match = 2;
  bool require_rtx_prefix = 3;
}
```

## ⚠️ Важные замечания

1. **ID товара**: Должен быть уникальным в рамках источника данных
2. **Цена**: Всегда в рублях, без копеек
3. **URL**: Полные URL с протоколом (https://)
4. **Характеристики**: Все дополнительные данные помещаются в объект `characteristics`
5. **Изображения**: `image_url` - основное изображение, `images` - все изображения
6. **Статистика**: Обязательно для каждого запроса
7. **gRPC**: Все парсеры подключаются к Product-Filter-Service как клиенты
8. **Кэширование**: Централизованное кэширование только в Product-Filter-Service
9. **Фильтрация**: Применяется только в Product-Filter-Service

## 🔗 Совместимость с Product-Filter-Service

Данный формат полностью совместим с gRPC интерфейсом Product-Filter-Service и может быть напрямую передан в метод `FilterProducts`. Все парсеры должны использовать единый proto файл для обеспечения совместимости. 