/**
 * Уникальная логика валидации для категории видеокарт
 */
import { normalizeForQuery, makeValidator } from '../utils/validation-utils';

export function customVideocardValidator(query: string, name: string, rules: any) {
  const normQuery = normalizeForQuery(query);
  const normName = normalizeForQuery(name);
  const cases = [
    {
      when: () => rules?.modelPatterns && rules.modelPatterns.some((pattern: RegExp) => pattern.test(name)),
      result: { isValid: true, reason: 'code-validated (model-pattern)', confidence: 0.95 }
    },
    {
      when: () => normName.includes(normQuery),
      result: { isValid: true, reason: 'code-validated (query)', confidence: 0.95 }
    }
  ];
  return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'no-query-match', confidence: 0.1 };
}

export const validateVideocard = makeValidator((query, name, rules) => customVideocardValidator(query, name, rules)); 