# API Routes Documentation

## Обзор

Этот документ описывает все API роуты Next.js приложения MarketVision. Все роуты действуют как прокси к внешнему API серверу.

## Конфигурация

Все роуты используют единую конфигурацию из `routes.config.ts`:

- **API_BASE_URL**: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api'`
- **Общие заголовки**: CORS настройки для всех ответов
- **Обработка ошибок**: Единообразная обработка ошибок

## Доступные роуты

### 1. `/api/popular-queries`
**Метод**: `GET`  
**Описание**: Получение популярных запросов  
**Параметры**: Нет  
**Ответ**: Массив популярных запросов с ценами

```typescript
// Пример ответа
[
  {
    query: "iPhone 15",
    minPrice: 45000,
    id: "iphone-15",
    priceChangePercent: -5.2
  }
]
```

### 2. `/api/products`
**Метод**: `GET`  
**Описание**: Получение всех продуктов или продуктов по запросу  
**Параметры**: 
- `query` (опционально) - поисковый запрос

**Ответ**: Продукты с рыночной статистикой

```typescript
// Пример ответа
{
  products: [
    {
      id: "1",
      name: "iPhone 15 Pro",
      price: 45000,
      image_url: "...",
      product_url: "...",
      source: "Wildberries",
      category: "smartphones",
      query: "iPhone 15"
    }
  ],
  marketStats: {
    min: 42000,
    max: 48000,
    mean: 45000,
    median: 44500,
    iqr: [43000, 47000]
  }
}
```

### 3. `/api/products-by-query/[query]`
**Метод**: `GET`  
**Описание**: Получение продуктов по конкретному запросу  
**Параметры**: 
- `query` (в пути) - поисковый запрос

**Ответ**: Продукты с рыночной статистикой для конкретного запроса

### 4. `/api/products/price-history-by-query`
**Метод**: `GET`  
**Описание**: Получение истории цен по запросу  
**Параметры**: 
- `query` (обязательно) - поисковый запрос
- `limit` (опционально, по умолчанию 10) - количество записей

**Ответ**: История цен

```typescript
// Пример ответа
[
  {
    price: 45000,
    created_at: "2024-01-15T10:30:00Z"
  }
]
```

### 5. `/api/products/[id]`
**Метод**: `GET`  
**Описание**: Получение продукта по ID  
**Параметры**: 
- `id` (в пути) - ID продукта

**Ответ**: Данные продукта

### 6. `/api/products-paginated`
**Метод**: `GET`  
**Описание**: Получение продуктов с пагинацией  
**Параметры**: 
- `page` (опционально, по умолчанию 1) - номер страницы
- `limit` (опционально, по умолчанию 10) - количество на странице

**Ответ**: Продукты с информацией о пагинации

```typescript
// Пример ответа
{
  products: [...],
  total: 150,
  hasMore: true
}
```

## Утилиты

### `createSuccessResponse(data, status)`
Создает успешный ответ с правильными заголовками.

### `createErrorResponse(error, status)`
Создает ответ с ошибкой.

### `fetchFromExternalApi(endpoint, options)`
Выполняет запрос к внешнему API с правильными заголовками.

### `getApiUrl(endpoint)`
Формирует полный URL для внешнего API.

## Обработка ошибок

Все роуты используют единообразную обработку ошибок:

1. **400 Bad Request**: Неверные параметры запроса
2. **500 Internal Server Error**: Ошибки внешнего API или внутренние ошибки

## CORS

Все роуты настроены для работы с CORS и поддерживают:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Использование в коде

```typescript
// В компонентах
const response = await fetch('/api/products?query=iPhone');
const data = await response.json();

// В сервисах
import { ApiService } from '@/app/services/apiService';
const products = await ApiService.getProducts('iPhone');
``` 