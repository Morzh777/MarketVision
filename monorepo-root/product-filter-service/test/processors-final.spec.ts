import { ProcessorsValidator } from '../src/services/validation.service/category/processors.validator';

describe('ProcessorsValidator - Final Test', () => {
  let validator: ProcessorsValidator;

  beforeEach(() => {
    validator = new ProcessorsValidator();
  });

  describe('9950x3d validation scenarios', () => {
    it('should validate correct 9950x3d processors', async () => {
      const validProducts = [
        'AMD Ryzen 9 9950X3D Processor',
        'Процессор AMD Ryzen 9 9950X3D',
        'AMD Процессор Ryzen 9 9950X3D',
        'Процессор AMD Ryzen 9 9950X3D AM5 OEM',
        'AMD Ryzen 9 9950X3D AM5 (100-000000719) (4.3GHz&#x2F;AMD Radeon) OEM',
        'процессор AMD Ryzen 9 9950X3D, 16&#x2F;32, 4.3-5.7GHz, 1280KB&#x2F;16MB&#x2F;128MB, AM5, Radeon, 170W, OEM',
        'процессор AMD Ryzen 9 9950X3D',
        'Центральный процессор AMD Ryzen 9 9950X3D OEM (100-000000719)',
        'Центральный процессор AMD Ryzen 9 9950X3D, OEM, AM5 (100-000000719)',
        'Процессор AMD Ryzen 9 9950X3D OEM 100-000000719',
        'Процессор AMD Ryzen 9 9950X3D AM5 (100-000000719) (4.3GHz&#x2F;AMD Radeon) OEM',
        'Проц AMD R9 9950X3D (Box)',
        'Процессор AMD Ryzen 9 9950X3D AM5 OEM'
      ];

      for (const productName of validProducts) {
        const result = await validator.validateSingleProduct(
          '9950x3d',
          productName,
          'processors'
        );
        
        expect(result.isValid).toBe(true);
        expect(result.reason).toBe('all-checks-passed');
      }
    });

    it('should reject products with 9950x (without 3D)', async () => {
      const invalidProducts = [
        'Процессор Ryzen 9 9950X AM5, 16C 32T, 4.3 5.7GHz, 64MB, 170W',
        'Процессор RYZEN X16 9950X SAM5 170W 4300 100-000001277'
      ];

      for (const productName of invalidProducts) {
        const result = await validator.validateSingleProduct(
          '9950x3d',
          productName,
          'processors'
        );
        
        expect(result.isValid).toBe(false);
        expect(['other-processor-model', 'no-match']).toContain(result.reason);
      }
    });

    it('should reject products with other processor models', async () => {
      const invalidProducts = [
        'Процессор 7800x3d такой же как 9950x3d но дешевле',
        'Сравнение 14900k vs 9950x3d',
        'AMD Процессор Ryzen 9 9900X3D OEM (без кулера)'
      ];

      for (const productName of invalidProducts) {
        const result = await validator.validateSingleProduct(
          '9950x3d',
          productName,
          'processors'
        );
        
        expect(result.isValid).toBe(false);
        expect(['other-processors-model', 'accessory']).toContain(result.reason);
      }
    });

    it('should reject accessories', async () => {
      const accessoryProducts = [
        'Кулер для AMD Ryzen 9 9950X3D',
        'Процессор Ryzen9 9950X3D OEM (без кулера)',
        'Процессор Ryzen 9 9950X3D OEM (без кулера) AM5 DDR5 CPU',
        'AMD Процессор Ryzen 9 9950X3D OEM (без кулера)',
        'AMD Процессор Ryzen 9 9950X3D BOX (без кулера)',
        'AMD Процессор Ryzen 9 9950X3D OEM (без кулера)'
      ];

      for (const productName of accessoryProducts) {
        const result = await validator.validateSingleProduct(
          '9950x3d',
          productName,
          'processors'
        );
        
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('accessory');
      }
    });

    it('should reject products with no query match', async () => {
      const result = await validator.validateSingleProduct(
        '9950x3d',
        'Intel Core i9-14900K Processor',
        'processors'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('other-processors-model');
    });
  });

  describe('Edge cases', () => {
    it('should handle case insensitive matching', async () => {
      const result = await validator.validateSingleProduct(
        '9950X3D',
        'amd ryzen 9 9950x3d processor',
        'processors'
      );
      
      expect(result.isValid).toBe(true);
    });

    it('should handle spaces in query', async () => {
      const result = await validator.validateSingleProduct(
        '9950 x3d',
        'AMD Ryzen 9 9950X3D Processor',
        'processors'
      );
      
      expect(result.isValid).toBe(true);
    });

    it('should reject unknown category', async () => {
      const result = await validator.validateSingleProduct(
        '9950x3d',
        'AMD Ryzen 9 9950X3D Processor',
        'unknown_category'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('unknown-category');
    });
  });
}); 