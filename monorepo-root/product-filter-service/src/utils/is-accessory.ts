import { ACCESSORY_WORDS } from '../validators/accessory-words';

export function isAccessory(name: string): boolean {
  const norm = name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, ' ');
  return ACCESSORY_WORDS.some(word => norm.split(' ').includes(word));
} 