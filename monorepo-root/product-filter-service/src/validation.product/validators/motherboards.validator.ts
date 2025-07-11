/**
 * Уникальная логика валидации для категории motherboards
 */

import { normalizeToLower } from '../../utils/validation-utils';

export function customMotherboardValidator(query: string, name: string, rules: any) {
  const n = normalizeToLower(name); // только к нижнему регистру
  const q = normalizeToLower(query.trim());

  if (!rules.chipsets || !Array.isArray(rules.chipsets) || rules.chipsets.length === 0) {
    return { isValid: false, reason: 'no-chipsets-in-rules', confidence: 0.0 };
  }

  // Проверяем, что query есть в chipsets
  if (!rules.chipsets.includes(q)) {
    return { isValid: false, reason: 'query-not-in-chipsets', confidence: 0.0 };
  }

  // Проверка на несколько чипсетов в названии
  const foundChipsets = rules.chipsets.filter((chipset: string) => {
    const regex = new RegExp(`\\b${chipset}\\b`, 'i');
    return regex.test(n);
  });
  if (foundChipsets.length > 1) {
    return { isValid: false, reason: 'conflicting-chipsets', confidence: 0.0 };
  }

  // Ищем только чистый чипсет как отдельное слово
  const regex = new RegExp(`\\b${q}\\b`, 'i');
  const found = regex.test(n);

  console.log({
    name,
    n,
    q,
    found,
    price: (typeof (arguments[2]?.price) !== 'undefined') ? arguments[2].price : undefined
  });

  if (found) {
    return { isValid: true, reason: 'chipset-match', confidence: 1.0 };
  }
  return { isValid: false, reason: 'no-query-chipset-in-name', confidence: 0.1 };
}

// export const validateMotherboard = makeValidator((query, name, rules) => customMotherboardValidator(query, name, rules)); 