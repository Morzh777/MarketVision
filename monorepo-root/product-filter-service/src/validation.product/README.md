# Гайд: Как добавить новую категорию для валидации товаров

## 1. Создайте правила категории

Перейдите в папку `categories/` и создайте новый файл, например, `mycategory.rules.ts`:

```ts
import { CategoryRule } from './category-rule.interface';

export const MYCATEGORY_RULES: CategoryRule = {
  name: ['название категории', 'синонимы'],
  brands: ['бренд1', 'бренд2'],
  series: ['серия1', 'серия2'],
  features: ['feature1', 'feature2'],
  minFeatures: 1,
  modelPatterns: [
    /регулярка1/i,
    /регулярка2/i
  ],
  categoryAccessories: ['аксессуар1', 'аксессуар2'],
  minNameLength: 5,
  // customValidator: (query, name) => ({ isValid: true, reason: '', confidence: 1.0 }) // если нужна уникальная логика
};
```
- **name** — ключевые слова-синонимы категории.
- **brands** — бренды, относящиеся к категории.
- **series** — серии/модели.
- **features** — важные характеристики.
- **minFeatures** — минимальное количество признаков для автоматической валидации.
- **modelPatterns** — (опционально) регулярки для поиска моделей.
- **categoryAccessories** — (опционально) слова-аксессуары для soft accessory фильтрации.
- **minNameLength** — (опционально) минимальная длина названия.
- **customValidator** — (опционально) функция для уникальной логики.

---

## 2. Создайте валидатор категории

Перейдите в папку `validators/` и создайте файл, например, `mycategory.validator.ts`:

```ts
import { ValidationResult } from '../unified-hybrid.validator';
import { CategoryRule } from '../categories/category-rule.interface';
import { normalizeForQuery } from '../utils/validation-utils';

export function validateMyCategory(query: string, productName: string, rules: CategoryRule): ValidationResult {
  const normQuery = normalizeForQuery(query);
  const normName = normalizeForQuery(productName);

  // Пример простой проверки
  if (normName.includes(normQuery)) {
    return {
      isValid: true,
      reason: 'code-validated (query)',
      confidence: 0.95
    };
  }

  return {
    isValid: false,
    reason: 'no-query-match',
    confidence: 0.1
  };
}
```
- Используйте любые проверки, которые нужны для вашей категории.
- Можно использовать поля из `rules` для гибкой логики.

---

## 3. Зарегистрируйте категорию в основном валидаторе

Откройте `unified-hybrid.validator.ts` и добавьте новую категорию в два объекта:

**a) Импортируйте правила и валидатор:**
```ts
import { MYCATEGORY_RULES } from './categories/mycategory.rules';
import { validateMyCategory } from './validators/mycategory.validator';
```

**b) Добавьте в маппинги:**
```ts
const CATEGORY_VALIDATORS = {
  // ... другие категории ...
  mycategory: validateMyCategory,
};

const CATEGORY_RULES_MAP = {
  // ... другие категории ...
  mycategory: MYCATEGORY_RULES,
};
```
- Ключ (`mycategory`) — это строка, которую вы будете использовать в запросах и DTO.

---

## 4. Готово!

Теперь система поддерживает новую категорию. Для тестирования добавьте тесты или используйте существующие e2e-тесты. 