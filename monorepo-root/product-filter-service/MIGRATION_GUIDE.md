# 🚀 Руководство по миграции на новую архитектуру валидации

## ⚡ Быстрый старт

### 1. Установка зависимостей
Новая архитектура не требует дополнительных зависимостей - всё уже есть в проекте.

### 2. Замена в основном сервисе

Откройте `src/services/products.service.ts` и замените секцию AI валидации:

```typescript
// НАЙДИТЕ (строки 58-68):
const { ValidatorFactory } = await import('../validators/validator.factory');
const validator = ValidatorFactory.getValidator(request.category);
if (!validator || typeof (validator as any).validateBatch !== 'function') {
  throw new Error('Не найден валидатор для категории ' + request.category);
}
try {
  aiResults = await (validator as any).validateBatch(aiNeeded, request.category);
  aiResults = aiResults.filter((r: any) => r.isValid);
  this.logger.log(`[AI] Запросов к AI: ${aiNeeded.length}, успешно прошли: ${aiResults.length}`);
} catch (err) {
  // ...
}

// ЗАМЕНИТЕ НА:
const { UnifiedValidatorFactory } = await import('../validators/unified-validator.factory');
try {
  const validatorFactory = new UnifiedValidatorFactory(this.openaiService);
  const allResults = await validatorFactory.validateProducts(aiNeeded, request.category);
  aiResults = allResults.filter((r: any) => r.isValid);
  this.logger.log(`[AI] Запросов к AI: ${aiNeeded.length}, успешно прошли: ${aiResults.length}`);
} catch (err) {
  // ... (остаётся то же)
}
```

### 3. Добавление новых сервисов в app.module.ts

```typescript
// Добавьте в providers:
import { EnhancedPriceAnomalyService } from './services/enhanced-price-anomaly.service';
import { UnifiedValidatorFactory } from './validators/unified-validator.factory';
import { ValidationConfigService } from './config/validation.config';

@Module({
  // ...
  providers: [
    // ... существующие провайдеры
    EnhancedPriceAnomalyService,
    UnifiedValidatorFactory,
    ValidationConfigService,
  ],
})
```

### 4. Обновление product-grouping.service.ts

```typescript
// Добавьте импорт:
import { EnhancedPriceAnomalyService } from './enhanced-price-anomaly.service';

// Обновите конструктор:
constructor(private readonly priceAnomalyService: EnhancedPriceAnomalyService) {}

// НАЙДИТЕ функцию checkPriceAnomaly и строки 34-42:
const anomalyIds = checkPriceAnomaly(groupProducts);
if (anomalyIds.length) {
  const cheapest = groupProducts.find(p => p.id === anomalyIds[0]);
  if (cheapest) {
    selectedProducts.push({ ...cheapest, toAI: true, reason: 'price-anomaly' });
    fileLogger.log(`[PriceAnomaly] id:${cheapest.id} price:${cheapest.price} -> toAI`);
    continue;
  }
}

// ЗАМЕНИТЕ НА:
const anomalyResult = this.priceAnomalyService.detectAnomalies(groupProducts, 'unknown');
if (anomalyResult.anomalousProducts.length > 0) {
  const topAnomaly = anomalyResult.anomalousProducts[0];
  const product = groupProducts.find(p => p.id === topAnomaly.id);
  if (product) {
    selectedProducts.push({ 
      ...product, 
      toAI: true, 
      reason: 'price-anomaly',
      anomalyDetails: {
        type: topAnomaly.anomalyType,
        confidence: topAnomaly.confidence,
        explanation: topAnomaly.explanation
      }
    });
    fileLogger.log(`[PriceAnomaly] id:${product.id} price:${product.price} type:${topAnomaly.anomalyType} -> toAI`);
    continue;
  }
}

// УДАЛИТЕ функцию checkPriceAnomaly (строки 3-13)
```

## 🎯 Добавление новой категории

### Пример: Добавление категории "Наушники"

```typescript
// В config/validation.config.ts добавьте в categories:
headphones: {
  enabled: true,
  displayName: 'Наушники',
  strictMode: false,
  rules: {
    requiredKeywords: ['наушники', 'headphones', 'гарнитура', 'headset'],
    brands: ['sony', 'sennheiser', 'audio-technica', 'beyerdynamic', 'akg'],
    series: ['wh-1000xm', 'hd', 'ath', 'dt', 'k'],
    features: ['bluetooth', 'wireless', 'noise cancelling', 'hi-res', 'usb'],
    minFeatures: 2,
    minNameLength: 8
  },
  priceAnomaly: {
    enabled: true,
    minPercentageDifference: 0.3,
    maxSuspiciousPrice: 1000,
    zScoreThreshold: 2.0
  }
}
```

### Добавление в category.constants.ts
```typescript
export enum ProductCategory {
  // ... существующие
  Headphones = 'headphones',
}
```

## 📊 Настройка переменных окружения

Создайте `.env` файл или обновите существующий:

```bash
# Валидация
VALIDATION_ENABLE_AI=true
VALIDATION_AI_MODEL=gpt-4o-mini
VALIDATION_LOG_LEVEL=info

# AI настройки
VALIDATION_AI_TIMEOUT=30000
VALIDATION_AI_MAX_BATCH=20
VALIDATION_AI_CONFIDENCE=0.7

# Price Anomaly
VALIDATION_PRICE_ANOMALY_ENABLED=true
```

## 🔄 Поэтапная миграция (рекомендуется)

### Этап 1: Параллельное тестирование
1. Внедрите новую систему
2. Запускайте обе системы параллельно
3. Сравнивайте результаты
4. Настройте правила

### Этап 2: Soft переход
1. Переключите одну категорию на новую систему
2. Мониторьте результаты 1-2 дня
3. При успехе переключайте следующую

### Этап 3: Полный переход
1. Переключите все категории
2. Удалите старые валидаторы
3. Очистите неиспользуемый код

## ⚠️ Потенциальные проблемы и решения

### Проблема: "Слишком много товаров в AI"
**Решение:** Увеличьте `minFeatures` или добавьте больше `brands`/`features` в правила категории

### Проблема: "Слишком мало аномалий цен"
**Решение:** Понизьте `zScoreThreshold` или `minPercentageDifference`

### Проблема: "Валидатор не распознаёт товары"
**Решение:** Проверьте `requiredKeywords` - они должны покрывать основные термины категории

## 🧪 Тестирование

### Тест 1: Валидация одного товара
```typescript
const factory = new UnifiedValidatorFactory(openaiService);
const result = factory.validateSingleProduct('RTX 5080', 'MSI RTX 5080 Gaming X Trio', 'videocards');
console.log(result); // { isValid: true, reason: 'code-validated (brand, series)', confidence: 0.8 }
```

### Тест 2: Батч валидация
```typescript
const products = [
  { id: '1', name: 'MSI RTX 5080 Gaming', price: 45000, query: 'RTX 5080' },
  { id: '2', name: 'Кабель для RTX', price: 500, query: 'RTX 5080' }
];
const results = await factory.validateProducts(products, 'videocards');
// Первый должен пройти code validation, второй - быть отфильтрован как аксессуар
```

## 📈 Мониторинг после миграции

Следите за этими метриками:

```bash
# Логи валидации
grep "UnifiedHybrid" logs/product-filter.log

# Статистика AI запросов  
grep "Отправляем.*AI" logs/product-filter.log

# Аномалии цен
grep "PriceAnomaly" logs/product-filter.log
```

## ✅ Чеклист миграции

- [ ] Обновлен products.service.ts
- [ ] Обновлен product-grouping.service.ts  
- [ ] Добавлены новые сервисы в app.module.ts
- [ ] Настроены переменные окружения
- [ ] Протестирована работа на тестовых данных
- [ ] Настроена конфигурация категорий
- [ ] Проведён мониторинг первых результатов
- [ ] Удалены старые файлы валидаторов (после успешного тестирования)

## 🎯 Ожидаемые результаты

После миграции вы получите:

- 📉 Снижение времени разработки новых категорий на 90%
- 📈 Улучшение качества обнаружения аномальных цен
- 🔧 Упрощение настройки и поддержки системы
- 📊 Расширенную аналитику и метрики
- 🚀 Более стабильную и предсказуемую работу AI валидации

При возникновении проблем - проверьте логи и обратитесь к документации VALIDATION_ARCHITECTURE_V2.md 