/**
 * Уникальная логика валидации для категории видеокарт
 */
import { normalizeForQuery, makeValidator } from '../utils/validation-utils';

export function customVideocardValidator(query: string, name: string, rules: any) {
  const normQuery = normalizeForQuery(query);

  // Извлекаем все модели по паттернам из rules
  const models = (rules.modelPatterns || [])
    .flatMap((pattern: RegExp) => {
      const found: string[] = [];
      const regex = new RegExp(pattern, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      let match;
      while ((match = regex.exec(name)) !== null) {
        if (match.length > 1 && match[match.length - 1]) {
          found.push(match[match.length - 1]);
        } else if (match[0]) {
          found.push(match[0]);
        }
      }
      return found;
    })
    .map(m => normalizeForQuery(m));
  const uniqueModels = Array.from(new Set(models)).filter(Boolean);

  if (
    !uniqueModels.includes(normQuery) ||
    uniqueModels.some(m => typeof m === 'string' && m !== normQuery && !normQuery.startsWith(m))
  ) {
    return { isValid: false, reason: 'multi-or-no-model-match', confidence: 0.1 };
  }
  return { isValid: true, reason: 'strict-model-match', confidence: 0.95 };
}

export const validateVideocard = makeValidator((query, name, rules) => customVideocardValidator(query, name, rules)); 