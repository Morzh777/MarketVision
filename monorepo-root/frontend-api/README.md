# Frontend API - MarketVision

Next.js приложение для API фронтенда MarketVision проекта.

## 📋 Описание

**Frontend API** - это Next.js приложение, которое служит API-шлюзом для фронтенда MarketVision. Оно предоставляет:

- **API роуты** для проксирования запросов к backend сервисам
- **Админ панель** для управления категориями, запросами и настройками парсинга
- **Аутентификация** через JWT токены с refresh механизмом
- **Проксирование** запросов через Nginx к соответствующим микросервисам

## 🎯 Основные функции

- **Управление категориями** - CRUD операции для категорий товаров
- **Управление запросами** - добавление, редактирование, удаление поисковых запросов
- **Настройки парсинга** - запуск парсинга по категориям, очистка кэша
- **Авторизация** - защищенные роуты с проверкой JWT токенов
- **API проксирование** - маршрутизация запросов к DB API и Product-Filter сервису

## 🏗️ Структура проекта

```
src/
├── app/                   # Next.js App Router
│   ├── admin/            # Админ панель (защищенная)
│   │   ├── page.tsx      # Главная страница админки (категории)
│   │   ├── queries/      # Управление запросами
│   │   │   └── page.tsx
│   │   ├── parsing/      # Настройки парсинга
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── ParsingClient.tsx
│   │   └── login/        # Страница входа администратора
│   │       └── page.tsx
│   ├── api/              # API routes
│   │   ├── admin/        # Админ API роуты
│   │   │   ├── categories/    # API категорий
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── queries/       # API запросов
│   │   │       ├── route.ts
│   │   │       ├── [id]/
│   │   │       │   └── route.ts
│   │   │       └── query/
│   │   │           └── [query]/
│   │   │               └── route.ts
│   │   ├── parsing/      # API парсинга
│   │   │   └── trigger/
│   │   │       └── route.ts
│   │   └── cache/        # API кэша
│   │       └── clear/
│   │           └── route.ts
│   ├── styles/           # SCSS стили
│   │   ├── components/   # Стили компонентов
│   │   │   ├── Admin.scss
│   │   │   ├── Parsing.scss
│   │   │   └── Queries.scss
│   │   └── globals.scss  # Глобальные стили
│   ├── layout.tsx        # Корневой layout
│   ├── page.tsx         # Главная страница (редирект)
│   └── not-found.tsx    # 404 страница
├── components/           # UI-компоненты
│   ├── ui/              # Базовые UI компоненты
│   │   ├── Button.tsx
│   │   ├── CustomSelect.tsx
│   │   ├── Modal.tsx
│   │   └── Icons.tsx
│   ├── admin/           # Компоненты админки
│   │   ├── AdminLayout.tsx
│   │   ├── Menu.tsx
│   │   ├── UserProfile.tsx
│   │   ├── CategoriesClient.tsx
│   │   ├── QueriesClient.tsx
│   │   └── QueriesServer.tsx
│   └── common/          # Общие компоненты
│       └── TelegramIdSaver.tsx
├── services/            # API и внешние сервисы
│   ├── categories.service.ts
│   └── http/            # HTTP клиенты
│       └── http-client.ts
├── hooks/               # Кастомные хуки
│   ├── useAuth.ts
│   └── useProducts.ts
├── config/              # Конфигурация
│   ├── pages.config.ts  # Конфигурация страниц
│   ├── api.config.ts    # API конфигурация
│   └── env.ts           # Переменные окружения
├── constants/           # Константы
│   └── api.ts           # API константы
├── shared/              # Общие типы и утилиты
│   ├── types/           # Типы
│   │   ├── auth.interface.ts
│   │   ├── categories.interface.ts
│   │   ├── products.interface.ts
│   │   ├── queries.interface.ts
│   │   └── modal.interface.ts
│   ├── schemas/         # Zod схемы валидации
│   │   ├── auth.schema.ts
│   │   ├── category.schema.ts
│   │   └── query.schema.ts
│   └── utils/           # Общие утилиты
│       └── categories.utils.ts
├── utils/               # Вспомогательные функции
│   ├── api/             # API утилиты
│   │   └── crud.utils.ts
│   ├── html.ts          # HTML утилиты
│   └── productFilters.ts # Утилиты фильтрации
└── middleware.ts        # Middleware для защиты маршрутов
```

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.