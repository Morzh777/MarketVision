import { MOTHERBOARD_ACCESSORY_WORDS, GPU_ACCESSORY_WORDS, CPU_ACCESSORY_WORDS, ACCESSORY_WORDS } from '../validators/accessory-words';

/**
 * Универсальный accessory-детектор по категории
 * @param name - название товара
 * @param category - категория ('motherboard', 'gpu', 'cpu' и т.д.)
 */
export function isAccessoryByCategory(name: string, category: string): boolean {
  const norm = name.toLowerCase();
  let words: string[] = [];
  switch (category) {
    case 'motherboard':
      words = MOTHERBOARD_ACCESSORY_WORDS;
      break;
    case 'gpu':
    case 'videocard':
      words = GPU_ACCESSORY_WORDS;
      break;
    case 'cpu':
    case 'processor':
      words = CPU_ACCESSORY_WORDS;
      break;
    default:
      words = ACCESSORY_WORDS;
  }
  return words.some(word => norm.includes(word));
}

/**
 * @deprecated Используй isAccessoryByCategory
 */
export function isAccessory(name: string): boolean {
  const norm = name.toLowerCase();
  return ACCESSORY_WORDS.some(word => norm.includes(word));
} 