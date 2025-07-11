require('dotenv').config();
import { UnifiedHybridValidator } from '../src/validation.product/unified-hybrid.validator';
import { OpenAiValidationService } from '../src/services/openai.service';
import { EnhancedPriceAnomalyService } from '../src/services/enhanced-price-anomaly.service';

// Добавить хелпер для одиночной валидации
async function validateSingle(validator, query, name, category) {
  return (await validator.validateBatch([{ query, name, category }]))[0];
}

describe('Unified Validation System (E2E)', () => {
  let validator: UnifiedHybridValidator;
  let openaiService: OpenAiValidationService;
  let priceAnomalyService: EnhancedPriceAnomalyService;

  beforeAll(() => {
    openaiService = new OpenAiValidationService();
    validator = new UnifiedHybridValidator(openaiService);
    priceAnomalyService = new EnhancedPriceAnomalyService();
  });

  describe('Single Product Validation', () => {
    it('should validate RTX 5080 videocard correctly', async () => {
      const result = await validateSingle(validator, 'RTX 5080', 'MSI RTX 5080 Gaming X Trio 16GB', 'videocards');
      expect(result.isValid).toBe(true);
      expect(result.reason).toContain('code-validated');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should reject accessory products', async () => {
      const result = await validateSingle(validator, 'RTX 5080', 'Кабель для RTX 5080', 'videocards');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory-words');
    });

    it('should validate processor correctly', async () => {
      const result = await validateSingle(validator, '7800X3D', 'AMD Ryzen 7 7800X3D', 'processors');
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Batch Validation', () => {
    const testProducts = [
      { id: '1', name: 'MSI RTX 5080 Gaming X Trio 16GB', price: 85000, query: 'RTX 5080' },
      { id: '2', name: 'Кабель DisplayPort для RTX 5080', price: 500, query: 'RTX 5080' },
      { id: '3', name: 'ASUS RTX 5080 TUF Gaming', price: 90000, query: 'RTX 5080' },
      { id: '4', name: 'RTX 5080 sticker pack', price: 200, query: 'RTX 5080' }
    ];

    it('should handle batch validation correctly', async () => {
      const results = await validator.validateBatch(testProducts, 'videocards');
      expect(results).toHaveLength(4);
      
      // Первый и третий товары должны пройти валидацию
      expect(results[0].isValid).toBe(true);
      expect(results[2].isValid).toBe(true);
      
      // Аксессуары должны быть отклонены
      expect(results[1].isValid).toBe(false);
      expect(results[3].isValid).toBe(false);
    }, 30000);
  });

  describe('Price Anomaly Detection', () => {
    const productsWithAnomaly = [
      { id: '1', name: 'RTX 5080 Gaming', price: 85000, query: 'RTX 5080' },
      { id: '2', name: 'RTX 5080 TUF', price: 90000, query: 'RTX 5080' },
      { id: '3', name: 'RTX 5080 Cheap', price: 15000, query: 'RTX 5080' }, // Аномально дешёвый
    ];

    it('should detect price anomalies', () => {
      const result = priceAnomalyService.detectAnomalies(productsWithAnomaly, 'videocards');
      
      expect(result.anomalousProducts.length).toBeGreaterThan(0);
      expect(result.statistics.mean).toBeGreaterThan(0);
      
      // Проверяем, что самый дешёвый товар был помечен как аномалия
      const anomalousIds = result.anomalousProducts.map(a => a.id);
      expect(anomalousIds).toContain('3');
    });

    it('should provide detailed anomaly statistics', () => {
      const result = priceAnomalyService.detectAnomalies(productsWithAnomaly, 'videocards');
      
      expect(result.statistics.mean).toBeCloseTo(63333, 0); // (85000 + 90000 + 15000) / 3
      expect(result.statistics.median).toBeCloseTo(85000, 0);
      expect(result.statistics.std).toBeGreaterThan(0);
    });
  });

  describe('Configuration-based Validation', () => {
    it('should handle unknown category gracefully', async () => {
      const result = await validateSingle(validator, 'test', 'Test Product', 'unknown_category');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('не содержит запрос');
    });

    it('should validate different categories with different rules', async () => {
      // Тест для процессоров
      const processorResult = await validateSingle(validator, 'i7-13700K', 'Intel Core i7-13700K', 'processors');
      expect(processorResult.isValid).toBe(true);

      // Тест для PlayStation
      const playstationResult = await validateSingle(validator, 'PS5', 'Sony PlayStation 5 Console', 'playstation');
      expect(playstationResult.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty product name', async () => {
      const result = await validateSingle(validator, 'RTX 5080', '', 'videocards');
      expect(result.isValid).toBe(false);
    });

    it('should handle very short product names', async () => {
      const result = await validateSingle(validator, 'RTX 5080', 'RTX', 'videocards');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('слишком короткое название');
    });

    it('should handle products without query match', async () => {
      const result = await validateSingle(validator, 'RTX 5080', 'PlayStation 5 Console', 'videocards');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('не содержит запрос');
    });
  });

  describe('PlayStation 5 Validation', () => {
    it('should validate PS5 console as valid', async () => {
      const result = await validateSingle(validator, 'playstation 5', 'Игровая консоль PlayStation 5 Slim Digital Edition', 'playstation');
      expect(result.isValid).toBe(true);
    });
    it('should reject accessory (геймпад)', async () => {
      const result = await validateSingle(validator, 'playstation 5', 'Геймпад DualSense для PS5', 'playstation');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/аксессуар|accessory/i);
    });
    it('should reject accessory (зарядная станция)', async () => {
      const result = await validateSingle(validator, 'playstation 5', 'Зарядная станция для PS5', 'playstation');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/аксессуар|accessory/i);
    });
    it('should reject accessory (portal)', async () => {
      const result = await validateSingle(validator, 'playstation 5', 'PlayStation Portal для PS5', 'playstation');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/аксессуар|accessory|not-ps5/i);
    });
    it('should reject диск', async () => {
      const result = await validateSingle(validator, 'playstation 5', 'Диск для PlayStation 5', 'playstation');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/аксессуар|accessory/i);
    });
    it('should reject кабель', async () => {
      const result = await validateSingle(validator, 'playstation 5', 'Кабель HDMI для PS5', 'playstation');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/аксессуар|accessory/i);
    });
    it('should reject PS5 Pro if query is not pro', async () => {
      const result = await validateSingle(validator, 'playstation 5', 'Игровая консоль PlayStation 5 Pro', 'playstation');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/is-ps5-pro|not-ps5-pro/);
    });
    it('should validate PS5 Pro if query is pro', async () => {
      const result = await validateSingle(validator, 'playstation 5 pro', 'Игровая консоль PlayStation 5 Pro', 'playstation');
      expect(result.isValid).toBe(true);
    });
  });
}); 