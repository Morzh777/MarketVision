/**
 * Уникальная логика валидации для категории nintendo_switch
 */
import { normalizeForQuery, makeValidator } from '../utils/validation-utils';

export function customNintendoSwitchValidator(query: string, name: string, rules: any) {
  const normQuery = normalizeForQuery(query);
  const normName = normalizeForQuery(name);
  const cases = [
    {
      when: () => normName.includes(normQuery),
      result: { isValid: true, reason: 'code-validated (query)', confidence: 0.95 }
    }
  ];
  return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'no-query-match', confidence: 0.1 };
}

export const validateNintendoSwitch = makeValidator((query, name, rules) => customNintendoSwitchValidator(query, name, rules)); 