# 🚀 WBInfo - Монорепо

## 📋 Описание проекта

WBInfo - это система мониторинга цен на компьютерные комплектующие с интеграцией WildBerries и Ozon. Проект состоит из микросервисов, работающих через gRPC.

## 🏗️ Архитектура

```
Bot (Telegram) ← Пользовательский интерфейс
    ↓
Product Filter Service (порт 3001) ← Центральный хаб
    ↓                    ↓
WB API (порт 3000)    Ozon API (порт 3002)
    ↓                    ↓
WildBerries           Ozon.ru
```

## 📁 Структура проекта

```
monorepo-root/
├── bot/                    # Telegram бот
├── product-filter-service/ # Центральный сервис фильтрации
├── wb-api/                # API для WildBerries
├── ozon-api/              # API для Ozon
├── yam-api/               # API для Яндекс.Маркет
├── logs/                  # Логи всех сервисов
├── PROTO-GUIDE.md         # Гайд по proto файлам
├── API-STANDARDS-GUIDE.md # Гайд по API стандартам
├── DEBUG-GUIDE.md         # Гайд по отладке
└── INTEGRATION-README.md  # Интеграция сервисов
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Установить зависимости для всех сервисов
npm run install:all
```

### 2. Запуск всех сервисов

```bash
# Запустить все сервисы
npm run start:all
```

### 3. Проверка статуса

```bash
# Проверить что все сервисы работают
npm run status
```

## 📚 Гайды для разработчиков

### 🆕 Для новичков (Junior)

1. **[API-STANDARDS-GUIDE.md](./API-STANDARDS-GUIDE.md)** - Как работают API и какие данные они возвращают
2. **[PROTO-GUIDE.md](./PROTO-GUIDE.md)** - Как работать с proto файлами и gRPC
3. **[DEBUG-GUIDE.md](./DEBUG-GUIDE.md)** - Как отлаживать проблемы

### 🔧 Для опытных разработчиков

1. **[INTEGRATION-README.md](./INTEGRATION-README.md)** - Детальная интеграция сервисов
2. **[API-DATA-STANDARD.md](../API-DATA-STANDARD.md)** - Полный стандарт данных API
3. **[PARSER-DATA-STANDARD.md](../PARSER-DATA-STANDARD.md)** - Стандарт данных парсеров

## 🧪 Тестирование

### Анализ данных

```bash
cd tests
node analyze-raw-api-data.js      # Анализ сырых данных API
node analyze-grpc-requests.js     # Анализ gRPC запросов
node analyze-product-filter-data.js # Анализ данных Product Filter
```

### Проверка сервисов

```bash
# Проверить статус всех сервисов
npm run test:architecture

# Запустить все тесты
npm run test:all
```

## 🔧 Полезные команды

```bash
# Управление сервисами
npm run start:all          # Запустить все сервисы
npm run stop:all           # Остановить все сервисы
npm run restart:all        # Перезапустить все сервисы
npm run status             # Статус всех сервисов

# Логи
npm run logs:all           # Логи всех сервисов
npm run logs:wb-api        # Логи WB API
npm run logs:ozon-api      # Логи Ozon API
npm run logs:product-filter # Логи Product Filter

# Кэш
npm run clear:cache        # Очистить все кэши

# Сборка
npm run build:all          # Собрать все сервисы
npm run build:proto        # Перегенерировать proto файлы
```

## 🚨 Частые проблемы

### Сервис не запускается
1. Проверь что порт свободен
2. Проверь зависимости: `npm run install:all`
3. Проверь логи: `npm run logs:all`

### API возвращает пустые данные
1. Проверь что сайты доступны
2. Проверь логи конкретного API
3. Перезапусти сервис: `npm run restart:wb-api`

### Ошибки proto файлов
1. Перегенерируй proto: `npm run build:proto`
2. Перезапусти сервисы
3. Проверь что все поля заполнены

## 📊 Мониторинг

### Портфолио сервисов
- **WB API**: http://localhost:3000/health
- **Product Filter Service**: http://localhost:3001/health
- **Ozon API**: gRPC на порту 3002

### Логи
- Все логи сохраняются в папке `logs/`
- Ротация логов происходит автоматически
- Максимальный размер лога: 100MB

## 🔄 Разработка

### Добавление нового API

1. Создай новый микросервис по образцу WB API
2. Используй тот же proto файл
3. Добавь gRPC клиент в Product Filter Service
4. Обнови словари валидации
5. Протестируй интеграцию

### Изменение структуры данных

1. Обнови proto файлы во всех сервисах
2. Перегенерируй код: `npm run build:proto`
3. Обнови код сервисов
4. Перезапусти все сервисы

## 📞 Поддержка

### Команды
- **@backend-team** - WB API, Product Filter Service
- **@python-team** - Ozon API
- **@dev-team** - Общие вопросы, архитектура

### Каналы
- **#wbinfo-dev** - Обсуждение разработки
- **#wbinfo-bugs** - Сообщения об ошибках
- **#wbinfo-features** - Предложения новых функций

## 📈 Статистика проекта

- **Микросервисов**: 4
- **Языков программирования**: 3 (TypeScript, Python, JavaScript)
- **API интеграций**: 3 (WildBerries, Ozon, Яндекс.Маркет)
- **Категорий товаров**: 3 (видеокарты, процессоры, материнские платы)

## 🎯 Цели проекта

- [x] Мониторинг цен на WildBerries
- [x] Мониторинг цен на Ozon
- [ ] Мониторинг цен на Яндекс.Маркет
- [x] Фильтрация и валидация товаров
- [x] Кэширование результатов
- [x] Telegram бот для уведомлений
- [ ] Веб-интерфейс для администрирования
- [ ] Аналитика и отчеты 