# 🛍️ Ozon API Parser

gRPC сервис для парсинга товаров с Ozon с использованием undetected-chromedriver. Работает как gRPC сервер для Product-Filter-Service.

## 🚀 Особенности

- **gRPC сервер** - интеграция с Product-Filter-Service
- **Undetected ChromeDriver** - обход детекции ботов
- **Чистая архитектура** - модульная структура
- **Поддержка платформ** - специальные ID для игровых консолей
- **Единый формат данных** - совместимость с PARSER-DATA-STANDARD

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
  string query = 1;
  string category = 2;
  string platform_id = 3;
}
```

### Поддерживаемые категории:
- **videocards** - Видеокарты
- **processors** - Процессоры  
- **motherboards** - Материнские платы
- **playstation** - PlayStation 5
- **playstation_accessories** - Аксессуары PS5
- **nintendo_switch** - Nintendo Switch (с платформой)

### Платформы для Nintendo:
- **101858153** - Nintendo Switch 2, Nintendo Switch OLED

## 📊 Формат данных

Сервис возвращает данные в едином формате согласно `PARSER-DATA-STANDARD.md`:

```json
{
  "id": "unique_id",
  "name": "Название товара", 
  "price": 65000,
  "image_url": "https://...",
  "product_url": "https://...",
  "category": "videocards",
  "source": "ozon",
  "query": "rtx 5070"
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

---

**Ozon API** - надежный gRPC сервер для парсинга товаров с Ozon! 🚀 