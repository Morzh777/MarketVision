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
  "query": "string",
  "category": "string",
  "all_queries": ["string"],
  "exclude_keywords": ["string"],
  "products": [],
  "source": "string",
  "config": {}
}
```

### Важные моменты:

1. **Поле `query`** - основной запрос для поиска
2. **Поле `category`** - унифицированная категория (например: "videocards", "processors", "motherboards")
3. **Поле `source`** - указывает целевой API ("wb" или "ozon")
4. **Каждый API конвертирует категорию в свой внутренний slug**

## Маппинг категорий

### WB API (WildBerries)
- Категории конвертируются в `xsubject` параметры
- Конфигурация хранится в `categories.config.ts`

### Ozon API (Ozon)
- Категории конвертируются в `category_slug` параметры
- Некоторые запросы могут требовать дополнительный `platform_id`
- Конфигурация хранится в `categories.config.ts`

## Значения source

- `"wb"` - данные от WB API
- `"ozon"` - данные от Ozon API

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

## Управление категориями и запросами

### Конфигурация категорий
- Файл: `product-filter-service/src/config/categories.config.ts`
- Содержит маппинг категорий для WB и Ozon
- Поддерживает платформы для специфичных запросов

### Конфигурация запросов
- Файл: `product-filter-service/src/config/queries.config.ts`
- Содержит запросы по категориям
- Легко добавлять новые запросы и категории

## Преимущества упрощенной структуры

1. **Меньше трафика** - убраны пустые поля
2. **Быстрее обработка** - меньше данных для парсинга
3. **Чище код** - только нужные поля
4. **Единообразие** - одинаковый формат для всех API
5. **Простота анализа** - легко понять структуру данных
6. **Гибкость** - легко добавлять новые категории и запросы 