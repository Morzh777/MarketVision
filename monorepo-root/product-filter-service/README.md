# Product-Filter-Service

## 📦 Описание

**Product-Filter-Service** — центральный сервис агрегации, фильтрации и кэширования товаров с Wildberries и Ozon. Работает как HTTP API для бота и как gRPC-клиент к парсерам.

---

## 🏗️ Архитектура

```
Bot (Telegram/HTTP) → Product-Filter-Service (HTTP API) → WB API (gRPC) + Ozon API (gRPC)
```
- **ProductsService** — логика агрегации, фильтрации, кэширования
- **RedisService** — кэширование и быстрый доступ
- **gRPC-клиенты** — связь с WB и Ozon API
- **PhotoService** — обработка изображений
- **PriceStatisticsService** — расширенная статистика цен

---

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки (ts-node, src/)
npm run start:dev

# Сборка и запуск в проде (dist/)
npm run build
npm run start:prod
```

---

## ⚙️ Переменные окружения

- `REDIS_URL` — URL Redis (по умолчанию: redis://localhost:6379)
- `WB_API_URL` — адрес gRPC WB API (по умолчанию: localhost:3000)
- `OZON_API_URL` — адрес gRPC Ozon API (по умолчанию: localhost:3002)
- `LOG_LEVEL` — уровень логирования (info, debug, warn, error)

---

## 📡 Основные HTTP API

- `POST /products/search` — поиск и фильтрация товаров
- `GET /price-statistics/daily-summary/:date` — ежедневная сводка по ценам
- `GET /price-statistics/weekly-report/:weekKey` — недельный отчёт
- `GET /price-statistics/market-insights` — рыночные инсайты
- `GET /price-statistics/bot-reports` — все отчёты для бота

---

## 🧩 Работа с proto-файлами

- **ВАЖНО:** gRPC-клиенты используют путь к proto-файлам через `process.cwd()`, чтобы сервис работал одинаково в dev/prod:
  ```js
  const PROTO_PATH = path.join(process.cwd(), 'proto/raw-product.proto');
  ```
- proto-файл должен лежать в папке `proto/` в корне сервиса.
- Не требуется копировать proto-файлы в dist/.

---

## 🧪 Тестирование

- `npm run test` — юнит-тесты
- `npm run test:statistics` — тесты статистики
- `npm run test:extended` — тесты расширенной статистики

---

## 📊 Мониторинг и логи

- Все логи пишутся в папку `logs/`
- Метрики: время обработки, кэш hits/misses, статистика цен
- Ошибки и важные события логируются с уровнем info/warn/error

---

## 🛠️ gRPC

- Используется `@grpc/grpc-js` и `@grpc/proto-loader`
- Протоколы описаны в `proto/raw-product.proto`
- Методы: фильтрация, кэширование, получение кэша, очистка кэша

---

## 💡 Советы по dev/prod

- В dev-режиме (`npm run start:dev`) сервис работает из исходников, proto-файл ищется в `proto/`
- В prod-режиме (`npm run start:prod`) сервис работает из dist, proto-файл также ищется в `proto/` (благодаря process.cwd())
- Не копируйте proto-файлы в dist вручную — это не требуется

---

## ❓ FAQ / Типовые ошибки

**Q: Ошибка ENOENT: no such file or directory, open '.../dist/proto/raw-product.proto'**
- A: Проверьте, что proto-файл лежит в папке `proto/` в корне сервиса. Путь должен формироваться через `process.cwd()`, а не через `__dirname`.

**Q: gRPC не может подключиться к WB/Ozon API**
- A: Проверьте переменные окружения `WB_API_URL` и `OZON_API_URL`, убедитесь, что сервисы доступны.

**Q: Redis не подключается**
- A: Проверьте переменную `REDIS_URL` и что Redis-сервер запущен.

---

## 📚 Полезные команды

```bash
# Запуск сервиса
npm run start:dev

# Сборка и запуск в проде
npm run build
npm run start:prod

# Тесты
npm run test:all
```

---

**Product-Filter-Service** — быстрый, надёжный и расширяемый сервис для агрегации и фильтрации товаров с Wildberries и Ozon!
