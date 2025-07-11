import { UnifiedHybridValidator, CATEGORY_DEFINITIONS } from '../unified-hybrid.validator';

// ACCESSORY_WORDS и isAccessory удалены, аксессуарная логика теперь только в кастомных валидаторах

/**
 * normalizeForQuery — нормализует строку для поиска: приводит к нижнему регистру и убирает все пробелы.
 * @param str — исходная строка
 * @returns нормализованная строка
 */
export function normalizeForQuery(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '');
}

export type ProductCategory = typeof CATEGORY_DEFINITIONS[number]['key'];

/**
 * Группирует продукты по query и валидирует каждый батч через UnifiedHybridValidator
 */
export async function groupAndValidateByQuery(
  validator: UnifiedHybridValidator,
  products: any[],
  category: ProductCategory
): Promise<any[]> {
  const byQuery: Record<string, any[]> = {};
  for (const product of products) {
    const q = product.query || '';
    if (!byQuery[q]) byQuery[q] = [];
    byQuery[q].push(product);
  }
  const allResults = await Promise.all(
    Object.entries(byQuery).map(async ([query, items]) => {
      return validator.validateBatch(items, category);
    })
  );
  return allResults.flat();
}

/**
 * makeValidator — обёртка для делегирования кастомному валидатору, если он есть, иначе использует дефолтную логику.
 */
export function makeValidator(
  defaultValidator: (query: string, productName: string, rules: any) => any
) {
  return (query: string, productName: string, rules: any) =>
    (rules.customValidator ?? defaultValidator)(query, productName, rules);
} 