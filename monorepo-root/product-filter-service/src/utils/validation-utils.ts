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