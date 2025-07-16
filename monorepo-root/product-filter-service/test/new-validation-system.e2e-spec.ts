require('dotenv').config();
import { ValidationFactoryService } from '../src/services/validation.service/validation-factory.service';
import { MotherboardsValidator } from '../src/services/validation.service/category/motherboards.validator';
import { ProcessorsValidator } from '../src/services/validation.service/category/processors.validator';
import { VideocardsValidator } from '../src/services/validation.service/category/videocards.validator';
import { PlaystationValidator } from '../src/services/validation.service/category/playstation.validator';
import { NintendoSwitchValidator } from '../src/services/validation.service/category/nintendo-switch.validator';
import { SteamDeckValidator } from '../src/services/validation.service/category/steam-deck.validator';
import { IphoneValidator } from '../src/services/validation.service/category/iphone.validator';

describe('New Validation System (E2E)', () => {
  let validationFactory: ValidationFactoryService;

  beforeAll(() => {
    const motherboardsValidator = new MotherboardsValidator();
    const processorsValidator = new ProcessorsValidator();
    const videocardsValidator = new VideocardsValidator();
    const playstationValidator = new PlaystationValidator();
    const nintendoSwitchValidator = new NintendoSwitchValidator();
    const steamDeckValidator = new SteamDeckValidator();
    const iphoneValidator = new IphoneValidator();

    validationFactory = new ValidationFactoryService(
      motherboardsValidator,
      processorsValidator,
      videocardsValidator,
      playstationValidator,
      nintendoSwitchValidator,
      steamDeckValidator,
      iphoneValidator
    );
  });

  describe('Motherboards Validation', () => {
    it('should validate valid motherboard', async () => {
      const result = await validationFactory.validateSingleProduct(
        'z790',
        'ASUS ROG STRIX Z790-E GAMING WIFI',
        'motherboards'
      );
      expect(result.isValid).toBe(true);
      expect(result.reason).toBe('chipset-match');
    });

    it('should reject accessory', async () => {
      const result = await validationFactory.validateSingleProduct(
        'z790',
        'Кабель питания для материнской платы Z790',
        'motherboards'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory');
    });

    it('should reject conflicting chipsets', async () => {
      const result = await validationFactory.validateSingleProduct(
        'z790',
        'ASUS ROG STRIX Z790-E GAMING WIFI + B760M',
        'motherboards'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('conflicting-chipsets');
    });
  });

  describe('Processors Validation', () => {
    it('should validate valid processor', async () => {
      const result = await validationFactory.validateSingleProduct(
        '7800X3D',
        'AMD Ryzen 7 7800X3D',
        'processors'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject accessory', async () => {
      const result = await validationFactory.validateSingleProduct(
        '7800X3D',
        'Кулер для AMD Ryzen 7 7800X3D',
        'processors'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory');
    });
  });

  describe('Videocards Validation', () => {
    it('should validate valid videocard', async () => {
      const result = await validationFactory.validateSingleProduct(
        'RTX 5080',
        'MSI GeForce RTX 5080 Gaming X Trio',
        'videocards'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject accessory', async () => {
      const result = await validationFactory.validateSingleProduct(
        'RTX 5080',
        'Кабель питания для RTX 5080',
        'videocards'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory');
    });
  });

  describe('PlayStation Validation', () => {
    it('should validate PS5 console', async () => {
      const result = await validationFactory.validateSingleProduct(
        'playstation 5',
        'Sony PlayStation 5 Console',
        'playstation'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject accessory', async () => {
      const result = await validationFactory.validateSingleProduct(
        'playstation 5',
        'Геймпад DualSense для PS5',
        'playstation'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory');
    });

    it('should validate PS5 Pro when query includes pro', async () => {
      const result = await validationFactory.validateSingleProduct(
        'playstation 5 pro',
        'Sony PlayStation 5 Pro Console',
        'playstation'
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Nintendo Switch Validation', () => {
    it('should validate Nintendo Switch console', async () => {
      const result = await validationFactory.validateSingleProduct(
        'nintendo switch',
        'Nintendo Switch OLED Console',
        'nintendo_switch'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject accessory', async () => {
      const result = await validationFactory.validateSingleProduct(
        'nintendo switch',
        'Joy-Con контроллеры для Nintendo Switch',
        'nintendo_switch'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory');
    });
  });

  describe('Steam Deck Validation', () => {
    it('should validate Steam Deck console', async () => {
      const result = await validationFactory.validateSingleProduct(
        'steam deck',
        'Valve Steam Deck OLED',
        'steam_deck'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject accessory', async () => {
      const result = await validationFactory.validateSingleProduct(
        'steam deck',
        'Чехол для Steam Deck',
        'steam_deck'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory');
    });
  });

  describe('iPhone Validation', () => {
    it('should validate iPhone', async () => {
      const result = await validationFactory.validateSingleProduct(
        'iphone 16 pro',
        'Apple iPhone 16 Pro 256GB',
        'iphone'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject accessory', async () => {
      const result = await validationFactory.validateSingleProduct(
        'iphone 16 pro',
        'Чехол для iPhone 16 Pro',
        'iphone'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('accessory');
    });
  });

  describe('Batch Validation', () => {
    it('should handle batch validation correctly', async () => {
      const products = [
        { query: 'z790', name: 'ASUS ROG STRIX Z790-E GAMING WIFI', price: 45000 },
        { query: 'z790', name: 'Кабель для Z790', price: 500 },
        { query: 'RTX 5080', name: 'MSI GeForce RTX 5080 Gaming X Trio', price: 120000 },
        { query: 'RTX 5080', name: 'Кабель для RTX 5080', price: 800 }
      ];

      const results = await validationFactory.validateProducts(products, 'motherboards');
      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown category', () => {
      expect(() => {
        validationFactory.getValidator('unknown_category' as any);
      }).toThrow('Неизвестная категория: unknown_category');
    });

    it('should handle empty product name', async () => {
      const result = await validationFactory.validateSingleProduct(
        'z790',
        '',
        'motherboards'
      );
      expect(result.isValid).toBe(false);
    });

    it('should handle very short product names', async () => {
      const result = await validationFactory.validateSingleProduct(
        'z790',
        'Z790',
        'motherboards'
      );
      expect(result.isValid).toBe(false);
    });
  });
}); 