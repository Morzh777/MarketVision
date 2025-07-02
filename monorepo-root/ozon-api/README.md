# Ozon API Parser

HTTP API сервис для парсинга товаров с Ozon с использованием undetected-chromedriver.

## 🚀 Особенности

- **Undetected ChromeDriver** - обход детекции ботов
- **HTTP API** - REST endpoints для получения данных
- **gRPC клиент** - подключение к Product-Filter-Service
- **Чистая архитектура** - модульная структура
- **Единый формат данных** - совместимость с product-filter-service

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

## 🌐 HTTP Endpoints

### Корневой endpoint
```http
GET /
```

### Получить продукты
```http
GET /api/v1/products?query=rtx 5080
```

### Сырые данные
```http
GET /api/v1/raw
```

### Проверка здоровья
```http
GET /api/v1/health
```

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │    │  Product-Filter │    │   WB API        │
│   (NestJS)      │◄──►│  Service        │◄──►│   (NestJS)      │
│   Port: 3002    │    │  Port: 3003     │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │ gRPC (50051)
                                │
                       ┌─────────────────┐
                       │   Ozon API      │
                       │   (Python)      │
                       │   Port: 3001    │
                       └─────────────────┘
```

## 📊 Формат данных

Сервис возвращает данные в едином формате согласно `PARSER-DATA-STANDARD.md`:

```json
{
  "id": "unique_id",
  "name": "Название товара",
  "price": num,
  "description": "Описание",
  "image_url": "https://...",
  "product_url": "https://...",
  "images": ["https://..."],
  "characteristics": {},
  "category": "videocards",
  "availability": true,
  "supplier": "Ozon",
  "source": "ozon"
}
```

## 🔧 Интеграция с Product-Filter-Service

Ozon API подключается к Product-Filter-Service как gRPC клиент на `localhost:50051` и отправляет данные для фильтрации и кэширования.

## 🐳 Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python build_proto.py

EXPOSE 3001

CMD ["python", "src/main.py"]
```

## 🔍 Отладка

```bash
# Проверить статус
curl http://localhost:3001/

# Получить продукты
curl http://localhost:3001/api/v1/products

# Проверить здоровье
curl http://localhost:3001/api/v1/health

# Получить сырые данные
curl http://localhost:3001/api/v1/raw
```

## 📁 Структура проекта

```
src/
├── domain/
│   ├── entities/
│   │   └── product.py
│   ├── repositories/
│   │   └── product_repository.py
│   └── services/
│       └── parser_service.py
├── application/
│   └── services/
│       └── product_service.py
├── infrastructure/
│   ├── parsers/
│   │   └── ozon_parser.py
│   ├── repositories/
│   │   └── redis_product_repository.py
│   ├── services/
│   │   └── ozon_parser_service.py
│   └── grpc/
│       └── product_filter_client.py
└── presentation/
    └── controllers/
        └── ozon_controller.py
``` 