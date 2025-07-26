// Транслитерация с русской раскладки на английскую
const russianToEnglishMap: Record<string, string> = {
  'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p',
  'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l',
  'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm',
  'Й': 'Q', 'Ц': 'W', 'У': 'E', 'К': 'R', 'Е': 'T', 'Н': 'Y', 'Г': 'U', 'Ш': 'I', 'Щ': 'O', 'З': 'P',
  'Ф': 'A', 'Ы': 'S', 'В': 'D', 'А': 'F', 'П': 'G', 'Р': 'H', 'О': 'J', 'Л': 'K', 'Д': 'L',
  'Я': 'Z', 'Ч': 'X', 'С': 'C', 'М': 'V', 'И': 'B', 'Т': 'N', 'Ь': 'M'
};

// Транслитерация с английской раскладки на русскую
const englishToRussianMap: Record<string, string> = {
  'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з',
  'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д',
  'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь',
  'Q': 'Й', 'W': 'Ц', 'E': 'У', 'R': 'К', 'T': 'Е', 'Y': 'Н', 'U': 'Ш', 'I': 'Щ', 'O': 'З', 'P': 'П',
  'A': 'Ф', 'S': 'Ы', 'D': 'В', 'F': 'А', 'G': 'П', 'H': 'Р', 'J': 'О', 'K': 'Л', 'L': 'Д',
  'Z': 'Я', 'X': 'Ч', 'C': 'С', 'V': 'М', 'B': 'И', 'N': 'Т', 'M': 'Ь'
};

/**
 * Транслитерирует текст с русской раскладки на английскую
 * Например: "зшрщту" -> "iphone"
 */
export function transliterateFromRussian(text: string): string {
  return text.split('').map(char => russianToEnglishMap[char] || char).join('');
}

/**
 * Транслитерирует текст с английской раскладки на русскую
 * Например: "iphone" -> "зшрщту"
 */
export function transliterateFromEnglish(text: string): string {
  return text.split('').map(char => englishToRussianMap[char] || char).join('');
}

/**
 * Создает варианты поиска с учетом транслитерации
 * Возвращает массив строк для поиска
 */
export function createSearchVariants(query: string): string[] {
  const variants = [query.toLowerCase()];
  
  // Добавляем транслитерацию с русской на английскую
  const transliteratedFromRussian = transliterateFromRussian(query);
  if (transliteratedFromRussian !== query) {
    variants.push(transliteratedFromRussian.toLowerCase());
  }
  
  // Добавляем транслитерацию с английской на русскую
  const transliteratedFromEnglish = transliterateFromEnglish(query);
  if (transliteratedFromEnglish !== query) {
    variants.push(transliteratedFromEnglish.toLowerCase());
  }
  
  return [...new Set(variants)]; // Убираем дубликаты
} 