# Ozon API Documentation

## Обзор

Ozon API - это gRPC сервис для парсинга товаров с Ozon.ru. Сервис предоставляет сырые данные без фильтрации и кэширования для Product-Filter-Service.

## Архитектура

```
Product-Filter-Service → Ozon API (gRPC) → Ozon Parser → Ozon.ru
```

**Порт:** 3002  
**Протокол:** gRPC  
**Proto файл:** `raw-product.proto`

## gRPC API Reference

### RawProductService

#### GetRawProducts

Получает список товаров с Ozon.ru по поисковому запросу.

**Метод:** `GetRawProducts`

**Request:**
```proto
message GetRawProductsRequest {
  string query = 1;        // Поисковый запрос (обязательно)
  string category = 2;     // Слаг категории (обязательно)
  string platform_id = 3;  // ID платформы (опционально)
}
```

**Response:**
```proto
message GetRawProductsResponse {
  repeated RawProduct products = 1;  // Список товаров
  int32 total_count = 2;             // Общее количество товаров
  string source = 3;                 // Источник данных ("ozon")
}
```

**RawProduct:**
```proto
message RawProduct {
  string id = 1;           // Уникальный ID товара
  string name = 2;         // Название товара
  int32 price = 3;         // Цена в рублях (целое число)
  string image_url = 4;    // URL изображения
  string product_url = 5;  // URL товара на Ozon
  string category = 6;     // Категория товара
  string source = 7;       // Источник ("ozon")
  string query = 8;        // Поисковый запрос
}
```


## Обработка ошибок

### gRPC Status Codes

| Код | Описание | Когда возникает |
|-----|----------|-----------------|
| `OK` | Успешно | Запрос выполнен успешно |
| `INVALID_ARGUMENT` | Некорректные аргументы | Пустой query или category |
| `UNAVAILABLE` | Сервис недоступен | Парсер не работает |
| `INTERNAL` | Внутренняя ошибка | Ошибка парсинга |
| `DEADLINE_EXCEEDED` | Превышен таймаут | Долгий ответ от Ozon |

### Примеры ошибок

```
INVALID_ARGUMENT: "Query cannot be empty"
INVALID_ARGUMENT: "Category cannot be empty"
UNAVAILABLE: "Parser service is currently unavailable"
INTERNAL: "Internal parser error: Network timeout"
```

## Примеры использования

### Python gRPC Client

```python
import grpc
import raw_product_pb2
import raw_product_pb2_grpc

# Подключение к сервису
channel = grpc.insecure_channel('localhost:3002')
stub = raw_product_pb2_grpc.RawProductServiceStub(channel)

# Создание запроса
request = raw_product_pb2.GetRawProductsRequest(
    query="RTX 4090",
    category="videokarty-15721"
)

# Выполнение запроса
try:
    response = stub.GetRawProducts(request)
    print(f"Найдено {response.total_count} товаров:")
    for product in response.products:
        print(f"- {product.name}: {product.price} руб.")
except grpc.RpcError as e:
    print(f"Ошибка: {e.code()} - {e.details()}")
```

### С платформой

```python
request = raw_product_pb2.GetRawProductsRequest(
    query="PlayStation 5",
    category="igrovye-pristavki-15625",
    platform_id="playstation-5"
)
```

## Производительность

- **Средняя скорость парсинга:** 2-5 секунд на запрос
- **Максимальное количество товаров:** 60 за запрос
- **Таймаут:** 30 секунд
- **Ретраи:** 3 попытки при ошибках

## Мониторинг и логирование

### Логи

Все операции логируются с префиксами:
- `🔍` - Начало парсинга
- `✅` - Успешное завершение
- `❌` - Ошибка
- `⚠️` - Предупреждение
- `🎮` - Обработка платформы

### Метрики

- Количество запросов в минуту
- Средняя скорость ответа
- Количество ошибок
- Доступность парсера

## Разработка и тестирование

### Запуск сервиса

```bash
cd monorepo-root/ozon-api
python -m pip install -r requirements.txt
python src/main.py
```

### Тестирование

```bash
# Unit тесты
pytest src/tests/

# Проверка типов
mypy src/

# Линтинг
flake8 src/
```

### Тестовый gRPC клиент

```bash
python test_grpc_client.py
```

## Соответствие стандартам

Сервис следует стандарту `PARSER-DATA-STANDARD.md`:

✅ **Обязательные поля:**
- `id` - уникальный строковый ID
- `name` - название товара  
- `price` - цена в рублях (число)
- `query` - поисковый запрос

✅ **Дополнительные поля:**
- `image_url` - URL изображения
- `product_url` - URL товара
- `category` - категория
- `source` - всегда "ozon"

## Ограничения

1. **Только парсинг** - без фильтрации и кэширования
2. **Последовательная обработка** - один запрос за раз
3. **Selenium зависимость** - требует ChromeDriver
4. **Блокировка Ozon** - может быть заблокирован при частых запросах

## Контакты поддержки

- **Репозиторий:** `monorepo-root/ozon-api/`
- **Логи:** Консоль приложения
- **Конфигурация:** `src/main.py` 