/**
 * Уникальная логика валидации для категории motherboards
 */

  import { normalizeToLower, makeValidator } from '../../utils/validation-utils';

export function customMotherboardValidator(query: string, name: string, rules: any) {
  const n = normalizeToLower(name); // только к нижнему регистру
  const q = normalizeToLower(query.trim());

  const cases = [
    {
      when: () => !rules.chipsets || !Array.isArray(rules.chipsets) || rules.chipsets.length === 0,
      result: { isValid: false, reason: 'no-chipsets-in-rules', confidence: 0.0 }
    },
    {
      when: () => !rules.chipsets.includes(q),
      result: { isValid: false, reason: 'query-not-in-chipsets', confidence: 0.0 }
    },
    {
      when: () => {
        const foundChipsets = rules.chipsets.filter((chipset: string) => {
          const regex = new RegExp(`\\b${chipset}\\b`, 'i');
          return regex.test(n);
        });
        return foundChipsets.length > 1;
      },
      result: { isValid: false, reason: 'conflicting-chipsets', confidence: 0.0 }
    },
    {
      when: () => {
        const regex = new RegExp(`\\b${q}\\b`, 'i');
        return regex.test(n);
      },
      result: { isValid: true, reason: 'chipset-match', confidence: 1.0 }
    }
  ];

  // Для отладки (оставляем как есть)
  console.log({
    name,
    n,
    q,
    found: cases[3].when(),
    price: (typeof (arguments[2]?.price) !== 'undefined') ? arguments[2].price : undefined
  });

  return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'no-query-chipset-in-name', confidence: 0.1 };
}

export const validateMotherboard = makeValidator((query, name, rules) => customMotherboardValidator(query, name, rules)); 