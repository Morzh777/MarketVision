# 🧪 Тесты для Product Filter System

## 📋 Описание

Набор тестов для проверки работоспособности gRPC Product Filter Service и интеграции с WB API.

## 🚀 Запуск тестов

### 1. Установка зависимостей
```bash
cd tests
npm install
```

### 2. Запуск gRPC сервиса
```bash
# В отдельном терминале
cd ../product-filter-service
npm run start:dev
```

### 3. Запуск WB API (опционально)
```bash
# В отдельном терминале
cd ../monorepo-root/wb-api
npm run start:dev
```

### 4. Запуск тестов

#### 🧪 Основные тесты
```bash
# Тест gRPC сервиса напрямую
npm run test:grpc

# Тест WB API с gRPC интеграцией
npm run test:wb-api

# Тестирование всех категорий
npm run test:categories

# Все тесты сразу
npm run test:all

# Расширенное тестирование
npm run test:full
```

#### 🔍 Диагностика и анализ
```bash
# Диагностика проблемных запросов (мок-данные)
npm run debug:failed-queries

# Анализ реальных данных WB API
npm run debug:real-wb-data

# Генерация оптимизированных запросов
npm run analyze:optimize-queries

# Финальный план оптимизации
npm run analyze:final-optimization

# Запуск всех диагностических тестов
npm run debug:all
```

## 🔍 Что тестируется

### test-grpc-service.js
- ✅ Фильтрация X3D процессоров
- ✅ Обработка кириллических символов (х vs x)
- ✅ Strict model matching (7800 ≠ 7600)
- ✅ Кэширование в Redis
- ✅ Производительность

### test-wb-api-grpc.js
- ✅ Интеграция WB API с gRPC
- ✅ Сравнение с legacy API
- ✅ Структура ответов
- ✅ Fallback при ошибках

### test-product-filter-integration.js
- ✅ HTTP API для бота
- ✅ Агрегация данных от WB API и Ozon API
- ✅ Группировка по запросам
- ✅ Выбор самого дешевого товара
- ✅ Кэширование и сравнение цен
- ✅ Health check и статистику

**Endpoints:**
- `POST /products/search` - поиск продуктов
- `GET /products/health` - статус сервиса
- `POST /products/cache/clear/:category` - очистка кэша
- `GET /products/cache/stats` - статистика кэша

## 📊 Ожидаемые результаты

### Успешная фильтрация:
```
🔍 Тестируем запрос: "7800x3d"
✅ Результат для "7800x3d":
   Входных продуктов: 3
   Прошли фильтр: 1
   Время обработки: 15мс
   1. AMD Ryzen 7 7800X3D BOX ✅
```

### Отклоненные продукты:
```
❌ Ryzen5 7600X3D BOX Процессор Близко к 7800X3D
   Причина: Модель не совпадает. Запрос: 7800, Продукт: 7600
```

## 🐛 Устранение проблем

### gRPC сервис не отвечает:
```bash
# Проверьте что сервис запущен
cd ../product-filter-service
npm run start:dev
```

### Redis не подключается:
```bash
# Запустите Redis
docker run -d -p 6379:6379 redis:7-alpine
```

### WB API недоступен:
```bash
# Запустите WB API
cd ../monorepo-root/wb-api
npm run start:dev
``` 