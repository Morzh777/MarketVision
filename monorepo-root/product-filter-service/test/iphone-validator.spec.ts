import { IphoneValidator } from '../src/services/validation.service/category/iphone.validator';

describe('IphoneValidator', () => {
  let iphoneValidator: IphoneValidator;

  beforeEach(() => {
    iphoneValidator = new IphoneValidator();
  });

  describe('iPhone 15 validation scenarios', () => {
    it('should validate correct iPhone 15', async () => {
      const validIphones = [
        'iPhone 15 128GB Black',
        'Apple iPhone 15 256GB Blue',
        'iPhone 15 512GB Natural Titanium',
        'Apple iPhone 15 128GB Pink',
        'iPhone 15 256GB Yellow',
        'Apple iPhone 15 512GB Black Titanium'
      ];

      for (const name of validIphones) {
        const result = await iphoneValidator.validateSingleProduct('iphone15', name, 'iphone');
        expect(result.isValid).toBe(true);
        expect(result.reason).toBe('all-checks-passed');
      }
    });

    it('should reject products with other iPhone models', async () => {
      const invalidIphones = [
        'iPhone 14 vs iPhone 15 comparison',
        'Сравнение iPhone 13 и iPhone 15',
        'iPhone 15 Pro vs iPhone 15',
        'iPhone 15 Pro Max review'
      ];

      for (const name of invalidIphones) {
        const result = await iphoneValidator.validateSingleProduct('iphone15', name, 'iphone');
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('other-iphone-model');
      }
    });

    it('should reject accessories', async () => {
      const accessories = [
        'Чехол для iPhone 15',
        'Защитное стекло iPhone 15',
        'Кабель зарядки iPhone 15',
        'Подставка для iPhone 15',
        'Наушники для iPhone 15'
      ];

      for (const name of accessories) {
        const result = await iphoneValidator.validateSingleProduct('iphone15', name, 'iphone');
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('accessory');
      }
    });

    it('should reject products with no query match', async () => {
      const noMatchProducts = [
        'Samsung Galaxy S24',
        'Google Pixel 8',
        'Xiaomi 14',
        'OnePlus 12'
      ];

      for (const name of noMatchProducts) {
        const result = await iphoneValidator.validateSingleProduct('iphone15', name, 'iphone');
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('no-match');
      }
    });
  });

  describe('iPhone 15 Pro validation scenarios', () => {
    it('should validate correct iPhone 15 Pro', async () => {
      const validIphones = [
        'iPhone 15 Pro 128GB Natural Titanium',
        'Apple iPhone 15 Pro 256GB Blue Titanium',
        'iPhone 15 Pro 512GB White Titanium',
        'Apple iPhone 15 Pro 1TB Black Titanium'
      ];

      for (const name of validIphones) {
        const result = await iphoneValidator.validateSingleProduct('iphone15pro', name, 'iphone');
        expect(result.isValid).toBe(true);
        expect(result.reason).toBe('all-checks-passed');
      }
    });

    it('should reject iPhone 15 (non-Pro) when searching for iPhone 15 Pro', async () => {
      const result = await iphoneValidator.validateSingleProduct(
        'iphone15pro',
        'iPhone 15 256GB Blue',
        'iphone'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('no-match');
    });
  });

  describe('Edge cases', () => {
    it('should handle case insensitive matching', async () => {
      const result = await iphoneValidator.validateSingleProduct(
        'IPHONE15',
        'iphone 15 128gb black',
        'iphone'
      );
      
      expect(result.isValid).toBe(true);
      expect(result.reason).toBe('all-checks-passed');
    });

    it('should handle spaces in query', async () => {
      const result = await iphoneValidator.validateSingleProduct(
        'iphone 15',
        'iPhone 15 256GB Blue',
        'iphone'
      );
      
      expect(result.isValid).toBe(true);
      expect(result.reason).toBe('all-checks-passed');
    });

    it('should reject unknown category', async () => {
      const result = await iphoneValidator.validateSingleProduct(
        'iphone15',
        'iPhone 15 128GB Black',
        'unknown-category'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('unknown-category');
    });
  });
}); 