// Привести к нижнему регистру
export function normalizeToLower(str: string): string {
  return str.toLowerCase();
}

// Привести к нижнему регистру и убрать все пробелы
export function normalizeToLowerNoSpaces(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '');
}

// Алиас для обратной совместимости
export const normalizeForQuery = normalizeToLowerNoSpaces;

// Универсальный враппер для кастомных валидаторов
export function makeValidator(
  defaultValidator: (query: string, productName: string, rules: any) => any
) {
  return (query: string, productName: string, rules: any) =>
    (rules.customValidator ?? defaultValidator)(query, productName, rules);
} 