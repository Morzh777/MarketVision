# Стандарт возвращаемых данных API

## Общая структура ответа

Все API (WB API и Ozon API) возвращают данные в едином формате через gRPC:

```json
{
  "products": [
    {
      "id": "string",
      "name": "string", 
      "price": number,
      "image_url": "string",
      "product_url": "string",
      "category": "string",
      "source": "string",
      "query": "string"
    }
  ],
  "total_input": number,
  "total_filtered": number,
  "processing_time_ms": number
}
```

## Поля продукта

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| `id` | string | Уникальный идентификатор товара | ✅ |
| `name` | string | Название товара | ✅ |
| `price` | number | Цена в рублях | ✅ |
| `image_url` | string | Ссылка на изображение товара | ✅ |
| `product_url` | string | Ссылка на страницу товара | ✅ |
| `category` | string | Категория товара (из gRPC запроса) | ✅ |
| `source` | string | Пометка источника данных ('wb' или 'ozon') | ✅ |
| `query` | string | Запрос, на который получен ответ (из gRPC запроса) | ✅ |

## Стандарт входящих данных для Product Filter Service

Product Filter Service отправляет gRPC запросы к WB API и Ozon API с единообразными категориями:

```json
{
  "query": "RTX 4070",
  "category": "videocards",
  "all_queries": ["RTX 4070"],
  "exclude_keywords": [],
  "products": [],
  "source": "wb",
  "config": {}
}
```

### Важные моменты:

1. **Поле `query`** - основной запрос для поиска
2. **Поле `category`** - унифицированная категория: "videocards", "processors", "motherboards"
3. **Поле `source`** - указывает целевой API ("wb" или "ozon")
4. **Каждый API конвертирует категорию в свой внутренний slug**

## Маппинг категорий

### WB API (WildBerries)
- `videocards` → `xsubject: 3274`
- `processors` → `xsubject: 3698` 
- `motherboards` → `xsubject: 3690`

### Ozon API (Ozon)
- `videocards` → `category_slug: "videokarty-15721"`
- `processors` → `category_slug: "protsessory-15726"`
- `motherboards` → `category_slug: "materinskie-platy-15725"`

## Значения категорий (единообразные)

- `videocards` - видеокарты
- `processors` - процессоры  
- `motherboards` - материнские платы

## Значения source

- `"wb"` - данные от WB API
- `"ozon"` - данные от Ozon API

## Примеры ответов

### WB API (RTX 4070)
```json
{
  "products": [
    {
      "id": "446901124",
      "name": "Видеокарта GeForce RTX 4070 WINDFORCE OC 12 ГБ",
      "price": 53320,
      "image_url": "https://images.wbstatic.net/c516x688/6.jpg",
      "product_url": "https://www.wildberries.ru/catalog/446901124/detail.aspx",
      "category": "videocards",
      "source": "wb",
      "query": "RTX 4070"
    }
  ],
  "total_input": 1,
  "total_filtered": 1,
  "processing_time_ms": 0
}
```

### Ozon API (RTX 4070)
```json
{
  "products": [
    {
      "id": "2148909740",
      "name": "Gigabyte Видеокарта GeForce GTX 1660 Ti ⚡GIGABYTE OC⚡6GB 6 ГБ",
      "price": 18104,
      "image_url": "https://cdn1.ozon.ru/s3/multimedia-1-w/7647426788.jpg",
      "product_url": "https://www.ozon.ru/product/gigabyte-videokarta-geforce-gtx-1660-ti-2148909740/",
      "category": "videocards",
      "source": "ozon",
      "query": "RTX 4070"
    }
  ],
  "total_input": 1,
  "total_filtered": 1,
  "processing_time_ms": 150
}
```

## Архитектура gRPC

```
Product-Filter-Service (HTTP) 
    ↓ gRPC
WB API (gRPC Server) → WildBerries (HTTP)
    ↓ gRPC  
Ozon API (gRPC Server) → Ozon (HTTP)
```

### gRPC методы

- **WB API**: `FilterProducts(request)` - порт 3000
- **Ozon API**: `FilterProducts(request)` - порт 3002
- **Product-Filter-Service**: HTTP API для бота - порт 3001

## Удаленные поля

Следующие поля были удалены из ответов API, так как они не используются:

- `description` - описание товара (часто пустое)
- `images` - массив изображений (всегда пустой)
- `characteristics` - характеристики товара (всегда пустой объект)
- `availability` - доступность (всегда "available")
- `supplier` - поставщик (всегда пустая строка)
- `brand` - бренд (всегда пустая строка)
- `filter_result.applied_rules` - примененные правила (всегда пустой массив)
- `processed_at` - время обработки (не нужно для анализа)

## Преимущества упрощенной структуры

1. **Меньше трафика** - убраны пустые поля
2. **Быстрее обработка** - меньше данных для парсинга
3. **Чище код** - только нужные поля
4. **Единообразие** - одинаковый формат для всех API
5. **Простота анализа** - легко понять структуру данных
6. **Правильные категории** - везде используется категория из gRPC запроса 