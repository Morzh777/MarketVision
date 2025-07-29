# 🎯 Стандарт валидации продуктов MarketVision

## 📋 Обзор

Система валидации продуктов обеспечивает точное соответствие товаров запросам пользователей. Каждый продукт должен пройти **ВСЕ** проверки, чтобы быть признанным валидным.

## 🏗️ Архитектура

### Базовый класс: `ProductValidatorBase`
```typescript
abstract class ProductValidatorBase {
  // Основной метод валидации
  async validateBatch(products: any[], category: string): Promise<ValidationResult[]>
  
  // Абстрактный метод для категорий
  protected abstract customValidation(query: string, name: string, rules: ValidationRules): ValidationResult
  
  // Общие методы
  protected normalizeForQuery(text: string): string
  protected isAccessory(name: string, accessoryWords: string[]): boolean
  protected extractModels(name: string, patterns: string[]): string[]
  
  // УНИВЕРСАЛЬНЫЙ метод проверки модели - ТОЧНОЕ СОВПАДЕНИЕ
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    const normQuery = this.normalizeForQuery(query);
    
    console.log(`[${this.constructor.name} MODEL MATCH] Query: "${query}" -> "${normQuery}"`);
    console.log(`[${this.constructor.name} MODEL MATCH] Models: [${models.join(', ')}]`);

    // Проверяем ТОЛЬКО точное совпадение
    if (models.includes(normQuery)) {
      console.log(`[${this.constructor.name} MODEL MATCH] ✅ Exact match found: ${normQuery}`);
      return { isValid: true, reason: 'model-match', confidence: 0.95 };
    }

    console.log(`[${this.constructor.name} MODEL MATCH] ❌ No exact match found`);
    return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
  }
  
  protected validateQueryInName(query: string, name: string): boolean
}
```

## 🔄 Процесс валидации

### Шаг 1: Нормализация
```typescript
// Вход: "PlayStation 5 Pro"
// Выход: "playstation5pro"
normalizeForQuery(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}
```

### Шаг 2: Последовательная проверка
Каждый продукт проходит **ВСЕ** проверки в строгом порядке:

1. **❌ Аксессуары** (БЛОКИРУЮЩАЯ)
2. **❌ Совпадение модели** (ОБЯЗАТЕЛЬНАЯ)
3. **❌ Запрос в названии** (ОБЯЗАТЕЛЬНАЯ)
4. **✅ Валидный продукт**

## 📝 Стандарт реализации

### Структура валидатора категории
```typescript
export class CategoryValidator extends ProductValidatorBase {
  // УНИВЕРСАЛЬНАЯ валидация в базовом классе:
  // 1. Проверка аксессуаров (БЛОКИРУЮЩАЯ)
  // 2. Проверка модели (ОБЯЗАТЕЛЬНАЯ) 
  // 3. Проверка запроса в названии (ОБЯЗАТЕЛЬНАЯ)
  
  // ТОЛЬКО категорийные проверки:
  protected categorySpecificValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    // Специфичные для категории проверки (если нужны)
    // Например: проверка серии видеокарт, версии PlayStation, etc.
    
    // ВСЕ проверки пройдены!
    console.log('✅ ACCEPTED: all checks passed');
    return { isValid: true, reason: 'all-checks-passed', confidence: 0.95 };
  }
}
```

## 🎮 Примеры валидации

### PlayStation 5 Pro
```typescript
// Запрос: "playstation 5 pro"
// Название: "PlayStation 5 Pro"

// Нормализация:
// Query: "playstation 5 pro" → "playstation5pro"
// Name: "PlayStation 5 Pro" → "playstation5pro"

// Проверки:
// 1. Аксессуар? ❌ (не содержит accessoryWords)
// 2. Модель? ✅ (извлечена "ps5pro", совпадает с запросом)
// 3. Запрос в названии? ✅ (содержит "playstation", "5", "pro")
// 4. Версия PlayStation? ✅ (hasCorrectPlayStationVersion)

// Результат: ✅ ПРИНЯТ
```

### PlayStation 5 Charging Station
```typescript
// Запрос: "playstation 5"
// Название: "PlayStation 5 DualSense Charging Station"

// Проверки:
// 1. Аксессуар? ✅ (содержит "зарядная станция")
// Результат: ❌ ОТКЛОНЕН (accessory)
```

## 🔧 Правила категорий

### PlayStation
```typescript
const PLAYSTATION_RULES: ValidationRules = {
  modelPatterns: [
    'ps\\d+',           // PS5, PS4, PS3
    'playstation\\s*\\d+', // PlayStation 5, PlayStation 4
    '\\d+',             // 5, 4, 3
  ],
  accessoryWords: [
    'зарядная станция', 'станция зарядки', 'зарядное устройство',
    'контроллер', 'джойстик', 'наушники', 'гарнитура',
    'portal', 'портативный', 'аксессуар'
  ]
};
```

### Видеокарты
```typescript
const VIDEOCARDS_RULES: ValidationRules = {
  modelPatterns: [
    'rtx\\s*\\d+\\d+\\d+', // RTX 4090, RTX 4080
    'gtx\\s*\\d+\\d+\\d+', // GTX 1660, GTX 1080
    'rx\\s*\\d+\\d+\\d+',  // RX 7900, RX 6800
  ],
  accessoryWords: [
    'кабель', 'блок питания', 'кулер', 'радиатор',
    'термопаста', 'аксессуар'
  ]
};
```

## ⚠️ Критические принципы

### 1. Последовательность проверок
- **НЕ** используйте `cases.find()` - это останавливает на первом успехе
- **ИСПОЛЬЗУЙТЕ** последовательные `if` блоки
- Продукт должен пройти **ВСЕ** проверки

### 2. Нормализация
- **ВСЕГДА** используйте `normalizeForQuery()` для сравнений
- Учитывайте, что пробелы удаляются: "PlayStation 5" → "playstation5"

### 3. Переиспользование методов
- **validateModelMatch** - универсальный метод в базовом классе
- **НЕ** переопределяйте `validateModelMatch` в категориях
- Переопределяйте только `extractModels` для специфичной логики извлечения

### 4. Отладка
- Добавляйте `console.log` для отслеживания процесса
- Логируйте нормализованные строки
- Указывайте причину отклонения

### 5. Уверенность (confidence)
- `0.9-1.0`: Высокая уверенность (аксессуары, явные несоответствия)
- `0.7-0.8`: Средняя уверенность (нет модели)
- `0.5-0.6`: Низкая уверенность (запрос не в названии)

## 🚀 Добавление новой категории

1. **Создайте файл:** `category-name.validator.ts`
2. **Наследуйтесь:** от `ProductValidatorBase`
3. **Реализуйте:** `customValidation()` с последовательными проверками
4. **Добавьте:** в `ValidationFactoryService`
5. **Протестируйте:** с различными сценариями

## 📊 Мониторинг

### Логи валидации
```typescript
console.log(`[${this.constructor.name} DEBUG]`, {
  query, name, models,
  normalizedQuery: this.normalizeForQuery(query),
  normalizedName: this.normalizeForQuery(name)
});
```

### Статистика
- Количество принятых/отклоненных продуктов
- Причины отклонений
- Время выполнения валидации

## 🔍 Тестирование

### Обязательные тесты
1. **Позитивные случаи:** валидные продукты
2. **Негативные случаи:** аксессуары, несоответствия
3. **Граничные случаи:** похожие названия
4. **Производительность:** большие объемы данных

### Пример теста
```typescript
describe('PlayStation Validator', () => {
  it('should accept valid PS5 Pro', () => {
    const result = validator.customValidation(
      'playstation 5 pro',
      'PlayStation 5 Pro',
      PLAYSTATION_RULES
    );
    expect(result.isValid).toBe(true);
  });
  
  it('should reject PS5 accessory', () => {
    const result = validator.customValidation(
      'playstation 5',
      'PlayStation 5 Charging Station',
      PLAYSTATION_RULES
    );
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('accessory');
  });
});
```

---

**Важно:** Этот стандарт обеспечивает единообразную и надежную валидацию продуктов во всех сервисах MarketVision. Следуйте ему строго для поддержания качества системы. 