import { makeValidator } from '../utils/validation-utils';
import { ValidationReason } from '../unified-hybrid.validator';

export function customIphoneValidator(query: string, name: string, rules: any) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();

  // Примитивная фильтрация аксессуаров
  const accessoryRegexps = [
    /чехол/i, /стекло/i, /пленка/i, /кабель/i, /зарядк[аои]/i, /адаптер/i, /батаре[яи]/i, /аккумулятор/i,
    /наклейка/i, /подставк[аои]/i, /корпус/i, /бокс/i, /провод/i, /геймпад/i, /контроллер/i, /дисплей/i, /экран/i
  ];

  const cases = [
    {
      when: () => accessoryRegexps.some(re => re.test(n)),
      result: { isValid: false, reason: ValidationReason.Accessory, confidence: 0.9 }
    },
    {
      when: () => (rules.features || []).filter(f => n.includes(f)).length < (rules.minFeatures ?? 1),
      result: { isValid: false, reason: 'insufficient-features', confidence: 0.5 }
    },
    {
      when: () => /iphone\s?1[1-6]\s?(pro|max|plus|mini)?/i.test(n),
      result: { isValid: true, reason: 'iphone-model-match', confidence: 1.0 }
    },
    {
      when: () => /iphone\s?se/i.test(n),
      result: { isValid: true, reason: 'iphone-se-match', confidence: 1.0 }
    }
  ];

  return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'uncertain', confidence: 0.3 };
}

export const validateIphone = makeValidator((query, name, rules) => customIphoneValidator(query, name, rules));
