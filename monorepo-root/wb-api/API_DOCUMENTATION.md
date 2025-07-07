# WB API Documentation

## Обзор

WB API - это gRPC сервис для парсинга товаров с Wildberries. Сервис предоставляет сырые данные без фильтрации и кэширования.

## gRPC API Reference

### RawProductService

#### GetRawProducts

Получает список товаров с Wildberries по поисковому запросу.

**Request:**
```proto
message GetRawProductsRequest {
  string query = 1;        // Поисковый запрос (обязательно)
  string category = 2;     // ID категории (обязательно, должно быть числом)
  string categoryKey = 3;  // Ключ категории (опционально)
}
```

**Response:**
```proto
message GetRawProductsResponse {
  repeated RawProduct products = 1;  // Список товаров
  int32 total_count = 2;             // Общее количество товаров
  string source = 3;                 // Источник данных ("wb")
}
```

**RawProduct:**
```proto
message RawProduct {
  string id = 1;           // Уникальный ID товара
  string name = 2;         // Название товара
  double price = 3;        // Цена в рублях
  string image_url = 4;    // URL изображения
  string product_url = 5;  // URL товара на WB
  string category = 6;     // Категория
  string source = 7;       // Источник ("wb")
  string query = 8;        // Поисковый запрос
}
```

**Пример использования:**

```typescript
const request = {
  query: "RTX 4090",
  category: "3690",
  categoryKey: "videocards"
};

client.GetRawProducts(request, (error, response) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${response.total_count} products`);
    response.products.forEach(product => {
      console.log(`${product.name}: ${product.price}₽`);
    });
  }
});
```

## Коды ошибок

| Код | Описание |
|-----|----------|
| `INVALID_ARGUMENT` | Неверные параметры запроса (пустой query или category) |
| `INTERNAL` | Внутренняя ошибка сервера или парсинга |

## Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   gRPC Client   │───▶│ GrpcServerService│───▶│ WbParserService │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │WildberriesApiClient│
                                               └─────────────────┘
```

### Компоненты

- **GrpcServerService**: Обработчик gRPC запросов
- **WbParserService**: Бизнес-логика парсинга 
- **WildberriesApiClient**: HTTP клиент для API Wildberries

## Конфигурация

- **Порт**: 3000
- **Протокол**: gRPC (insecure)
- **Proto файл**: `proto/raw-product.proto`

## Мониторинг

Сервис логирует следующие события:
- Запуск сервера
- Входящие запросы 
- Результаты парсинга
- Ошибки

## Производительность

- **Timeout**: 5000ms для запросов к WB API
- **User-Agent**: Установлен для обхода блокировок
- **Обработка ошибок**: Graceful degradation с пустыми результатами 