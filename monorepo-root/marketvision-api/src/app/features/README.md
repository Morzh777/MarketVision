# 🚀 Feature-Based Architecture Migration

## 📁 Новая структура модулей

### 🔐 Auth Module (`features/auth/`)
**Что перемещать:**
- `components/auth/LoginForm.tsx` → `features/auth/components/LoginForm/LoginForm.tsx`
- `hooks/useAuth.ts` → `features/auth/hooks/useAuth.ts`
- `services/authService.ts` → `features/auth/services/authService.ts`
- `types/user.types.ts` → `features/auth/types/auth.types.ts`

### 🛒 Products Module (`features/products/`)
**Что перемещать:**
- `components/ProductCard.tsx` → `features/products/components/ProductCard/ProductCard.tsx`
- `services/productService.ts` → `features/products/services/productService.ts`
- `types/market.ts` (Product типы) → `features/products/types/product.types.ts`

### 📊 Dashboard Module (`features/dashboard/`)
**Что перемещать:**
- `components/Sidebar.tsx` → `features/dashboard/components/Sidebar/Sidebar.tsx`
- `hooks/useQuerySorting.ts` → `features/dashboard/hooks/useQuerySorting.ts`
- `types/market.ts` (PopularQuery типы) → `features/dashboard/types/dashboard.types.ts`

### 📈 Analytics Module (`features/analytics/`)
**Что перемещать:**
- `components/ChartBlock.tsx` → `features/analytics/components/Charts/ChartBlock.tsx`
- `components/PriceHistory.tsx` → `features/analytics/components/PriceHistory/PriceHistory.tsx`
- `components/DealsBlock.tsx` → `features/analytics/components/Statistics/DealsBlock.tsx`

### ⚙️ Admin Module (`features/admin/`)
**Что перемещать:**
- Компоненты из `admin/page.tsx` разбить на отдельные компоненты
- Логику управления планировщиком → `features/admin/services/`

### 🔄 Shared Module (`shared/`)
**Что перемещать:**
- `components/ErrorBoundary.tsx` → `shared/components/UI/ErrorBoundary.tsx`
- `components/ImageModal.tsx` → `shared/components/Modals/ImageModal.tsx`
- `components/WalletIcon.tsx`, `CartIcon.tsx` → `shared/components/UI/`
- `utils/transliteration.ts` → `shared/utils/transliteration.ts`

## 🎯 Принципы миграции

1. **Один модуль = одна бизнес-функция**
2. **Каждый модуль самодостаточен**
3. **Общие компоненты в shared/**
4. **Экспорт через index.ts файлы**

## 📦 Импорты после миграции

```typescript
// Вместо
import { ProductCard } from '../components/ProductCard'
import { useAuth } from '../hooks/useAuth'

// Будет
import { ProductCard } from '@/features/products'
import { useAuth } from '@/features/auth'
import { ErrorBoundary } from '@/shared'
```

## ✅ Чек-лист миграции

- [ ] Переместить auth компоненты
- [ ] Переместить products компоненты  
- [ ] Переместить dashboard компоненты
- [ ] Переместить analytics компоненты
- [ ] Переместить admin компоненты
- [ ] Переместить shared компоненты
- [ ] Обновить импорты в страницах
- [ ] Настроить алиасы путей
- [ ] Удалить старые папки 