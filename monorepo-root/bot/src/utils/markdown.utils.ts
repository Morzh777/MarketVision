// Утилита для экранирования символов в MarkdownV2
export function escapeMarkdownV2(text: string): string {
  if (!text) return '';
  
  // Telegram требует экранировать эти символы в MarkdownV2
  const charsToEscape = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  
  return charsToEscape.reduce((acc, char) => {
    return acc.replace(new RegExp('\\' + char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '\\' + char);
  }, text);
}

// Безопасное форматирование цены
export function formatPriceMarkdown(price: number): string {
  return escapeMarkdownV2(price.toLocaleString('ru-RU')) + ' ₽';
} 