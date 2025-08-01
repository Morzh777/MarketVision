# 🛍️ Ozon API Parser

gRPC сервис для парсинга товаров с Ozon с использованием undetected-chromedriver. Работает как gRPC сервер для Product-Filter-Service.

## 🚀 Особенности

- **gRPC сервер** - интеграция с Product-Filter-Service
- **Undetected ChromeDriver** - обход детекции ботов
- **Персистентный браузер** - переиспользование между запросами
- **Чистая архитектура** - модульная структура
- **Поддержка платформ** - специальные ID для игровых консолей
- **Универсальные категории** - поддерживает любые категории Ozon
- **Единый формат данных** - совместимость с API-DATA-STANDARD

## 🏗️ Архитектура

```
Product-Filter-Service (gRPC Client) → Ozon-API (gRPC Server) → Ozon.ru
```

### Основные компоненты:
- **gRPC Server** - обработка запросов от Product-Filter-Service
- **Ozon Parser** - парсинг данных с Ozon через Selenium
- **Domain Services** - бизнес-логика и валидация

## 📦 Установка

```bash
cd monorepo-root/ozon-api
pip install -r requirements.txt
```

## 🔨 Генерация gRPC кода

```bash
python build_proto.py
```

## 🏃‍♂️ Запуск

```bash
python src/main.py
```

## 📡 gRPC API

### GetRawProducts
```protobuf
rpc GetRawProducts(GetRawProductsRequest) returns (GetRawProductsResponse)

message GetRawProductsRequest {
  string query = 1;        // Поисковый запрос
  string category = 2;     // Слаг категории
  string platform_id = 3;  // ID платформы (опционально)
  string exactmodels = 4;  // ID модели (опционально)
}
```

### Категории и модели:
Ozon API поддерживает **любые** категории и модели, которые пользователь может указать в запросе.

**Параметры:**
- **category** - слаг категории Ozon (например: `videokarty-15721`, `smartfony-15502`)
- **platform_id** - ID платформы для уточнения (опционально)
- **exactmodels** - ID конкретной модели (опционально)

**Примеры категорий:**
- `videokarty-15721` - Видеокарты
- `protsessory-15726` - Процессоры
- `smartfony-15502` - Смартфоны
- `igrovye-pristavki-15801` - Игровые приставки
- И любые другие категории Ozon

## 📊 Формат данных

Сервис возвращает данные в едином формате согласно `API-DATA-STANDARD.md`:

```json
{
  "id": "123456789",           // SKU товара
  "name": "Название товара", 
  "price": 65000,              // Цена в рублях
  "image_url": "https://...",  // URL изображения
  "product_url": "https://...", // URL товара на Ozon
  "category": "videokarty-15721", // Слаг категории
  "source": "ozon",            // Источник данных
  "query": "rtx 5070"          // Поисковый запрос
}
```

## 🔧 Технологический стек

- **Language**: Python 3.11+
- **gRPC**: grpcio, grpcio-tools
- **Web Scraping**: Selenium, undetected-chromedriver
- **HTTP Client**: httpx
- **Architecture**: Clean Architecture

## 📁 Структура проекта

```
src/
├── main.py                           # Точка входа
├── domain/                           # Доменная логика
│   ├── entities/
│   │   └── product.py               # Сущность товара
│   └── services/
│       └── parser_service.py        # Интерфейс парсера
├── infrastructure/                   # Инфраструктура
│   ├── grpc/
│   │   └── ozon_grpc_service.py     # gRPC сервер
│   ├── parsers/
│   │   └── ozon_parser.py           # Парсер Ozon
│   └── services/
│       └── ozon_parser_service.py   # Реализация парсера
└── raw_product_pb2*.py              # Сгенерированные gRPC файлы
```

## 🐳 Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python build_proto.py

EXPOSE 3002

CMD ["python", "src/main.py"]
```

## 🔍 Отладка

```bash
# Проверить gRPC сервер
grpcurl -plaintext localhost:3002 list

# Тестирование gRPC запроса
python test_grpc_client.py

# Проверить логи
tail -f logs/ozon-api.log
```

## 🧪 Тестирование

```bash
# Запуск тестового клиента
python test_grpc_client.py

# Тестирование всех категорий
python test_categories.py

# Проверка парсера
python -c "from src.infrastructure.parsers.ozon_parser import OzonParser; print('Parser OK')"
```

## 🚨 Частые проблемы

### ChromeDriver не найден
1. Установите Chrome: `sudo apt install google-chrome-stable`
2. Проверьте версию: `google-chrome --version`
3. Обновите undetected-chromedriver: `pip install --upgrade undetected-chromedriver`

### gRPC ошибки
1. Перегенерируйте proto: `python build_proto.py`
2. Проверьте порт: `netstat -tulpn | grep 3002`
3. Перезапустите сервис

### Парсинг не работает
1. Проверьте доступность Ozon
2. Обновите user-agent в парсере
3. Проверьте логи на ошибки
4. Убедитесь что браузер не заблокирован

### Медленная работа
1. Браузер переиспользуется между запросами
2. Первый запрос может быть медленнее (инициализация)
3. Последующие запросы работают быстрее

---

**Ozon API** - надежный gRPC сервер для парсинга товаров с Ozon! 🚀 