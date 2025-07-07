# 🛒 WB-API Microservice

Микросервис на базе [NestJS](https://nestjs.com/) для парсинга данных о компьютерных комплектующих с WildBerries. Работает как gRPC сервер для Product-Filter-Service.

## 📦 Описание

Сервис реализует простую архитектуру для парсинга товаров с WildBerries. Возвращает сырые данные без обработки, вся бизнес-логика находится в Product-Filter-Service.

### Ключевые особенности:
- **gRPC сервер** для интеграции с Product-Filter-Service
- **Сырые данные** без фильтрации и обработки
- **Поддержка всех категорий** через xsubject параметры
- **Простая архитектура** - только парсинг, без кэширования

## 🏗️ Архитектура

```
Product-Filter-Service (gRPC Client) → WB-API (gRPC Server) → WildBerries API
```

### Основные компоненты:
- **gRPC Server** - обработка запросов от Product-Filter-Service
- **WB Parser Service** - парсинг данных с WildBerries
- **WB API Client** - HTTP клиент для запросов к WildBerries

## 🚀 Основные возможности

- **gRPC сервер**: Обработка запросов от Product-Filter-Service
- **Сырые данные**: Возврат необработанных данных с WildBerries
- **Поддержка категорий**: Все категории через xsubject параметры
- **Простая архитектура**: Минимум кода, максимум функциональности

## 📡 gRPC API

### GetRawProducts
```protobuf
rpc GetRawProducts(GetRawProductsRequest) returns (GetRawProductsResponse)

message GetRawProductsRequest {
  string query = 1;
  string category = 2; // xsubject ID (например, "3274" для видеокарт)
  string platform_id = 3; // ID платформы (опционально)
}
```

### Примеры запросов:
- **Видеокарты**: `query: "rtx 5070", category: "3274"`
- **Процессоры**: `query: "7800x3d", category: "3698"`
- **Материнские платы**: `query: "z790", category: "3690"`

## 🔧 Требования

- Node.js >= 18
- npm
- gRPC поддержка

## 🛠️ Технологический стек

- **Framework**: [NestJS](https://nestjs.com/) - прогрессивный Node.js фреймворк
- **Language**: [TypeScript](https://www.typescriptlang.org/) - строгая типизация
- **gRPC**: @grpc/grpc-js, @grpc/proto-loader - межсервисное взаимодействие
- **HTTP Client**: Fetch API - запросы к WildBerries API

## 📁 Структура проекта

```
src/
├── main.ts                           # Точка входа
├── app.module.ts                     # Главный модуль
├── grpc-server/                      # gRPC сервер
│   └── grpc-server.service.ts       # gRPC сервис
├── parser/                           # Парсер WildBerries
│   └── wb-parser.service.ts         # Основной парсер
├── types/                            # Типы данных
│   └── raw-product.interface.ts     # Интерфейсы
└── wb-api.client.ts                 # HTTP клиент для WB API
```

---

## ⚙️ Технические параметры WB API

### WB xsubject значения (категории товаров)

**Актуальные значения xsubject для запросов к Wildberries API:**

| Категория | xsubject | Описание |
|-----------|----------|----------|
| **Видеокарты** | `3274` | Видеокарты и GPU для компьютеров |
| **Процессоры** | `3698` | CPU и процессоры для ПК |
| **Материнские платы** | `3690` | Материнские платы и системные платы |
| **PlayStation** | `8829` | Игровые консоли PlayStation |
| **Nintendo Switch** | `523` | Игровые консоли Nintendo |

### Использование в коде

```typescript
// Видеокарты
const xsubject = 3274;

// Процессоры
const xsubject = 3698;

// Материнские платы
const xsubject = 3690;
```

### Примеры API запросов к WB

```
https://search.wb.ru/exactmatch/ru/common/v13/search?query=rtx4070&xsubject=3274&sort=priceup

https://search.wb.ru/exactmatch/ru/common/v13/search?query=7800x3d&xsubject=3698&sort=priceup
```

**⚠️ Важно:** Эти значения специфичны для Wildberries API и могут изменяться. При изменении категорий на WB необходимо обновить значения в конфигурации Product-Filter-Service.

---

## 🐳 Docker и развертывание

### Запуск через Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f wb-api
```

### Локальная разработка

1. **Перейдите в директорию сервиса:**
   ```sh
   cd monorepo-root/wb-api
   ```

2. **Установите зависимости:**
   ```sh
   npm install
   ```

3. **Запустите приложение в режиме разработки:**
   ```sh
   npm run start:dev
   ```
   gRPC сервер будет доступен на порту 3000.

4. **Запуск в продакшен-режиме:**
   ```sh
   npm run build
   npm run start:prod
   ```

---

## 🧪 Тестирование

### Тестирование gRPC сервера

```bash
# Установка grpcurl
# Windows: choco install grpcurl
# Linux: apt install grpcurl

# Тест подключения
grpcurl -plaintext localhost:3000 list

# Тест запроса
grpcurl -plaintext -d '{"query":"rtx4070","category":"3274"}' \
  localhost:3000 raw_product.RawProductService/GetRawProducts
```

### Тестирование через Product-Filter-Service

```bash
# Тест через основной API
curl "http://localhost:3001/api/products?query=RTX4070&category=videocards"
```

---

## 🐛 Отладка

### Просмотр логов

```bash
# Docker
docker-compose logs -f wb-api

# Локально
npm run start:dev
```

### Проверка здоровья сервиса

```bash
# Проверка gRPC сервера
grpcurl -plaintext localhost:3000 list
```

### Частые проблемы

| Проблема | Решение |
|----------|---------|
| `gRPC UNAVAILABLE` | Проверьте что сервис запущен на порту 3000 |
| `WB API error` | Проверьте доступность WildBerries |
| `Invalid xsubject` | Проверьте корректность category параметра |
| `Container не запускается` | Проверьте логи: `docker-compose logs wb-api` |
| `Build failed` | Проверьте Dockerfile и зависимости |

---

## 📊 Мониторинг

### Логи
- Все логи выводятся в консоль
- Уровень логирования: INFO
- Формат: `🔍 WB API: {query} ({category})`

### Метрики
- Количество обработанных запросов
- Время ответа API
- Количество найденных товаров

---

## 🔄 Разработка

### Добавление новой категории

1. Добавьте xsubject в конфигурацию Product-Filter-Service
2. Протестируйте через gRPC запрос
3. Обновите документацию

### Изменение структуры данных

1. Обновите proto файл
2. Перегенерируйте код
3. Обновите интерфейсы
4. Перезапустите сервис

### Локальная разработка

```bash
# Запуск только Redis
docker-compose up redis -d

# Запуск сервиса локально
npm run start:dev

# Тестирование изменений
grpcurl -plaintext -d '{"query":"test","category":"3274"}' \
  localhost:3000 raw_product.RawProductService/GetRawProducts
```

---

## 📚 Дополнительные ресурсы

- [NestJS Documentation](https://docs.nestjs.com/)
- [gRPC Documentation](https://grpc.io/docs/)
- [WildBerries API](https://developer.wildberries.ru/)
- [DEVELOPER_GUIDE.md](../../DEVELOPER_GUIDE.md)

---

**🎉 Happy Coding!** При возникновении вопросов обращайтесь к команде разработки.
