import { playstationCustomValidator } from './playstation.validator';
import { PLAYSTATION_RULES } from '../categories/playstation.rules';

describe('PlayStation 5 Custom Validator (unit)', () => {
  const rules = PLAYSTATION_RULES;

  it('should validate PS5 console as valid', () => {
    const result = playstationCustomValidator('playstation 5', 'Игровая консоль PlayStation 5 Slim Digital Edition', rules);
    expect(result.isValid).toBe(true);
    expect(result.reason).toMatch(/ps5-match/);
  });

  it('should reject accessory (геймпад)', () => {
    const result = playstationCustomValidator('playstation 5', 'Геймпад DualSense для PS5', rules);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/аксессуар|accessory/i);
  });

  it('should reject accessory (зарядная станция)', () => {
    const result = playstationCustomValidator('playstation 5', 'Зарядная станция для PS5', rules);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/аксессуар|accessory/i);
  });

  it('should reject диск', () => {
    const result = playstationCustomValidator('playstation 5', 'Диск для PlayStation 5', rules);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/аксессуар|accessory/i);
  });

  it('should reject кабель', () => {
    const result = playstationCustomValidator('playstation 5', 'Кабель HDMI для PS5', rules);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/аксессуар|accessory/i);
  });

  it('should reject PS5 Pro if query is not pro', () => {
    const result = playstationCustomValidator('playstation 5', 'Игровая консоль PlayStation 5 Pro', rules);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/is-ps5-pro|not-ps5-pro/);
  });

  it('should validate PS5 Pro if query is pro', () => {
    const result = playstationCustomValidator('playstation 5 pro', 'Игровая консоль PlayStation 5 Pro', rules);
    expect(result.isValid).toBe(true);
    expect(result.reason).toMatch(/ps5-pro-match/);
  });
}); 