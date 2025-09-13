# Frontend API - MarketVision

Next.js приложение для API фронтенда MarketVision проекта.

## 🏗️ Структура проекта

```
src/
├── app/                   # Next.js App Router
│   ├── (public)/         # Публичная часть сайта
│   │   ├── (home)/       # Главная страница
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── Products.tsx
│   │   └── product/      # Страницы продуктов
│   │       └── [query]/
│   │           └── page.tsx
│   ├── (admin)/          # Админ панель (защищенная)
│   │   ├── layout.tsx    # Layout с проверкой авторизации
│   │   ├── page.tsx      # Управление категориями и запросами
│   │   ├── Admin.tsx     # Главная страница админки 
│   │   ├── login/        # Страница входа администратора
│   │   │   └── page.tsx
│   │   └── settings/     # Настройки парсера (время и частота парсинга)
│   │       └── page.tsx
│   ├── api/              # API routes
│   │   ├── auth/         # Auth.js API routes
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── categories/   # API категорий
│   │   ├── queries/      # API запросов
│   │   └── scheduler/    # API планировщика парсера
│   ├── layout.tsx        # Корневой layout
│   ├── page.tsx         # Главная страница (редирект)
│   ├── globals.css      # Глобальные стили
│   └── not-found.tsx    # 404 страница
├── components/           # UI-компоненты
│   ├── ui/              # Базовые UI компоненты
│   ├── forms/           # Формы и инпуты
│   ├── layout/          # Компоненты макета
│   ├── auth/            # Компоненты авторизации
│   │   ├── LoginForm.tsx
│   │   ├── AuthGuard.tsx
│   │   └── AdminProfile.tsx
│   ├── admin/           # Компоненты админки
│   │   ├── AdminHeader.tsx
│   │   ├── AdminSidebar.tsx
(категории + запросы)
│   │   ├── CategoriesTable.tsx
│   │   ├── QueriesTable.tsx
│   │   └── ParserSettings.tsx # Настройки парсера
│   └── common/          # Общие компоненты
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── InfiniteScroll.tsx
├── lib/                 # Библиотеки и утилиты
│   ├── storage/        # Управление токенами
│   │   └── cookie-storage.ts
│   ├── utils/          # Утилиты
│   │   └── token-utils.ts
│   └── api/            # API функции (legacy)
│       └── queries.api.ts
├── services/           # API и внешние сервисы
│   └── http/           # HTTP клиенты
│       └── http-client.ts
├── hooks/              # Кастомные хуки
│   └── useProductFilters.ts # Хуки фильтрации
├── config/             # Конфигурация
│   ├── pages.config.ts # Конфигурация страниц
│   └── env.ts          # Переменные окружения
├── constants/          # Константы
│   └── api.ts          # API константы
├── shared/             # Общие типы и утилиты
│   ├── types/          # Типы
│   │   ├── auth.interface.ts
│   │   ├── categories.interface.ts
│   │   ├── products.interface.ts
│   │   ├── queries.interface.ts
│   │   └── modal.interface.ts
│   ├── schemas/        # Zod схемы валидации
│   │   ├── auth.schema.ts
│   │   ├── category.schema.ts
│   │   └── query.schema.ts
│   └── utils/          # Общие утилиты
│       └── categories.utils.ts
├── utils/              # Вспомогательные функции
│   ├── html.ts         # HTML утилиты
│   ├── productFilters.ts # Утилиты фильтрации
│   └── transliteration.ts # Транслитерация
├── server-actions/     # Серверные действия
│   ├── categories.ts   # Действия с категориями
│   └── queries.ts      # Действия с запросами
└── middleware.ts       # Middleware для защиты маршрутов
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

## 📝 Правила разработки

### Компоненты
- Все компоненты должны быть в соответствующих папках
- Используй SCSS модули для стилизации
- Следуй BEM методологии

### Импорты
```typescript
// ✅ Правильно - прямые импорты
import { Button } from '@/components/ui/Button'
import { useProducts } from '@/hooks/useProducts'
import { ProductService } from '@/services/products/ProductService'
```

### Типизация
- Все типы в `shared/types.ts`
- Интерфейсы в `shared/interfaces.ts`
- Строгая типизация везде

## 🎨 Стилизация

Проект использует SCSS модули. См. правила в `scss-rules.mdc`.

## 🔧 Конфигурация

- TypeScript: `tsconfig.json`
- ESLint: `eslint.config.mjs`
- Next.js: `next.config.ts`

## 📚 Документация

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Rules](typescript-rules.mdc)
- [SCSS Rules](scss-rules.mdc)