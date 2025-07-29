import { ProcessorsValidator } from '../src/services/validation.service/category/processors.validator';
import { VideocardsValidator } from '../src/services/validation.service/category/videocards.validator';
import { MotherboardsValidator } from '../src/services/validation.service/category/motherboards.validator';

describe('Universal Validator - hasOtherModel', () => {
  let processorsValidator: ProcessorsValidator;
  let videocardsValidator: VideocardsValidator;
  let motherboardsValidator: MotherboardsValidator;

  beforeEach(() => {
    processorsValidator = new ProcessorsValidator();
    videocardsValidator = new VideocardsValidator();
    motherboardsValidator = new MotherboardsValidator();
  });

  describe('Processors validation', () => {
    it('should reject products with other processor models', async () => {
      const result = await processorsValidator.validateSingleProduct(
        '9950x3d',
        'Процессор 7800x3d такой же как 9950x3d но дешевле',
        'processors'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('other-processors-model');
    });

    it('should reject products with 9950x (without 3D)', async () => {
      const result = await processorsValidator.validateSingleProduct(
        '9950x3d',
        'Процессор Ryzen 9 9950X AM5, 16C 32T, 4.3 5.7GHz, 64MB, 170W',
        'processors'
      );
      
      expect(result.isValid).toBe(false);
      expect(['other-processor-model', 'no-match']).toContain(result.reason);
    });
  });

  describe('Videocards validation', () => {
    it('should reject products with other videocard models', async () => {
      const result = await videocardsValidator.validateSingleProduct(
        'rtx4090',
        'Сравнение RTX 4080 vs RTX 4090',
        'videocards'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('other-videocards-model');
    });

    it('should validate correct RTX 4090', async () => {
      const result = await videocardsValidator.validateSingleProduct(
        'rtx4090',
        'NVIDIA GeForce RTX 4090 Gaming X Trio',
        'videocards'
      );
      
      expect(result.isValid).toBe(true);
      expect(result.reason).toBe('all-checks-passed');
    });
  });

  describe('Motherboards validation', () => {
    it('should reject products with other motherboard models', async () => {
      const result = await motherboardsValidator.validateSingleProduct(
        'b650',
        'Сравнение B750 vs B650',
        'motherboards'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('other-motherboards-model');
    });

    it('should validate correct B650', async () => {
      const result = await motherboardsValidator.validateSingleProduct(
        'b650',
        'MSI MPG B650 GAMING EDGE WIFI',
        'motherboards'
      );
      
      expect(result.isValid).toBe(true);
      expect(result.reason).toBe('all-checks-passed');
    });
  });

  describe('Universal hasOtherModel method', () => {
    it('should work with different model types', () => {
      // Тестируем универсальный метод напрямую
      const testCases = [
        {
          query: '9950x3d',
          name: 'процессор7800x3dтакойжекак9950x3dнодешевле',
          models: ['7800x3d', '14900k'],
          expected: true
        },
        {
          query: 'rtx4090',
          name: 'nvidiageforcertx4080gamingxtrio',
          models: ['rtx4080', 'rtx4070'],
          expected: true
        },
        {
          query: 'b650',
          name: 'msimpgb750gamingedgewifi',
          models: ['b750', 'x670'],
          expected: true
        },
        {
          query: '9950x3d',
          name: 'amdryzen99950x3dprocessor',
          models: ['7800x3d', '14900k'],
          expected: false
        }
      ];

      testCases.forEach(testCase => {
        const result = processorsValidator['hasOtherModel'](
          testCase.query,
          testCase.name,
          testCase.models
        );
        expect(result).toBe(testCase.expected);
      });
    });
  });
}); 