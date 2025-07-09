import { BaseValidator, ValidationResult } from './base.validator';
import { isAccessory } from '../utils/is-accessory';

const BRANDS = [
  'msi', 'gigabyte', 'asus', 'asrock', 'maxsun', 'afox', 'machinist', 'pcwinmax', 'xiaodiao', 'esport', 'battle-ax', 'ayw', 'cvn', 'prime', 'tuf', 'challenger', 'pro', 'elite', 'terminator', 'riptide', 'eagle', 'frozen', 'legend', 'nitro', 'gaming', 'steel', 'plus', 'd3hp', 'ds3h', 'rs', 'm', 'x', 'e', 'v2', 'rtl', 'oem'
];
const FORM_FACTORS = [
  'atx', 'matx', 'microatx', 'micro-atx', 'mini-itx', 'itx'
];
const SOCKETS = [
  'lga1700', 'am5', 'am4', 'socketam5', 'soc-1700', 'soc1700', 'soc', 'socket'
];
const MEMORY = [
  'ddr4', 'ddr5', '2xddr4', '2xddr5', '4xddr4', '4xddr5'
];
const FEATURES = [
  'hdmi', 'vga', 'lan', 'wifi', 'm.2', '2xm.2', '1xm.2', 'usb', 'rtl', 'oem', 'edition', 'plus', 'pro', 'prime', 'tuf', 'challenger', 'elite', 'gaming', 'legend', 'steel', 'nitro', 'frozen', 'rs', 'd3hp', 'ds3h', 'v2', 'm', 'x', 'e'
];
function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '');
}
export class MotherboardValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    const name = productName.toLowerCase();
    const normName = normalize(productName);
    // 0️⃣ АКСЕССУАРЫ
    if (isAccessory(productName)) {
      return { isValid: false, reason: 'accessory-words' };
    }
    // 1️⃣ ДОЛЖНО БЫТЬ СОВПАДЕНИЕ QUERY (например, B760, B850, Z790, X870E)
    const normQuery = normalize(query);
    if (!normName.includes(normQuery)) {
      return { isValid: false, reason: 'query not found' };
    }
    // 2️⃣ КЛАСТЕРИЗАЦИЯ ПРИЗНАКОВ
    let features = 0;
    if (BRANDS.some(b => name.includes(b))) features++;
    if (FORM_FACTORS.some(f => name.includes(f))) features++;
    if (SOCKETS.some(s => name.includes(s))) features++;
    if (MEMORY.some(m => name.includes(m))) features++;
    if (FEATURES.some(f => name.includes(f))) features++;
    // 3️⃣ ДЛИНА НАЗВАНИЯ
    // if (productName.length < 10) {
    //   return { isValid: false, reason: 'placeholder/too short' };
    // }
    // 4️⃣ ДОЛЖНО БЫТЬ МИНИМУМ 2 ПРИЗНАКА
    if (features < 2) {
      return { isValid: false, reason: 'not enough features (need at least 2: brand, form-factor, socket, memory, etc)' };
    }
    // 5️⃣ OK
    return { isValid: true, reason: 'feature-clustered (brand/form-factor/socket/memory)' };
  }
  extractModel(text: string): string | null {
    return null;
  }
} 