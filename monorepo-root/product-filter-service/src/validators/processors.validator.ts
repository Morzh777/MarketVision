import { BaseValidator, ValidationResult } from './base.validator';
import { isAccessory } from '../utils/is-accessory';

const BRANDS = [
  'amd', 'intel', 'ryzen', 'xeon', 'core', 'pentium', 'celeron', 'gold', 'silver', 'platinum'
];
const SERIES = [
  // AMD Ryzen X3D
  '7800x3d', '9800x3d', '9950x3d', '7950x3d', '7900x3d', '5900x3d', '5800x3d', '3950x3d', '3900x3d',
  // AMD Ryzen обычные
  '7950x', '7900x', '5900x', '5800x', '3950x', '3900x', '3600x', '3500x', '3400g', '3200g',
  '9950x', '9900x', '9800x', '9700x', '9600x', '9500x',
  // Intel Core
  'i3', 'i5', 'i7', 'i9', '10400f', '12400f', '13900kf', '14700k', '13900k', '12700k', '11700k', '9900k', '8700k',
  // Xeon, Pentium, Celeron
  'xeon', 'pentium', 'celeron', 'gold', 'silver', 'platinum',
];
const FEATURES = [
  'cpu', 'процессор', '8c', '16t', '8 ядер', '16 потоков', 'ghz', 'мгц', 'без кулера', 'oem', 'box', 'l3', 'ddr5', 'am5', 'am4'
];
// accessory-words для процессоров (без "кулер", "box", "ядер", "потоков", "GHz", "OEM")
const ACCESSORY_WORDS = [
  'кабель', 'кабели', 'кабеля', 'наклейка', 'наклейки', 'наклеек', 'наклейку', 'наклейкой', 'подставка', 'подставки',
  'с кабелем', 'с наклейкой', 'с подставкой', 'с вентилятором', 'с сумкой', 'с переходником', 'с креплением', 'с чехлом', 'с сеткой', 'с кулером', 'с кабелем hdmi', 'с кабелем usb-c', 'с кабелем питания', 'с кабелями питания', 'с кабелями', 'с наклейками', 'с наклейкой rtx', 'с наклейкой 7800x3d', 'в подарок', 'комплект',
  'сумка', 'сумки', 'сетк', 'переходник', 'переходники', 'крепление', 'крепления', 'чехол', 'чехлы', 'fan', 'bag', 'sticker', 'holder', 'stand', 'cover', 'case', 'mount', 'adapter', 'splitter', 'extension', 'thermal', 'pad', 'screw', 'tool', 'cleaner', 'brush', 'sticker pack', 'gift'
];
const SUSPICIOUS_WORDS = [
  'sticker', 'наклейка', 'bag', 'limited edition', 'special edition', 'gift', 'в подарок', 'комплект'
];
const MODEL_PATTERN = /7[5689]00x3d|7950x3d|7600x3d/gi;
const IGNORE_ARTICLE = /100-000000910/gi;

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '');
}

export class ProcessorsValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    const name = productName.toLowerCase();
    const normName = normalize(productName);
    // 0️⃣ АКСЕССУАРЫ (ищем accessory-words как подстроку)
    for (const w of ACCESSORY_WORDS) {
      if (name.includes(w) || normName.includes(normalize(w))) {
        return {
          isValid: false,
          reason: 'accessory-words'
        };
      }
    }
    // 1️⃣ SUSPICIOUS/FAKE (ищем suspicious-words как подстроку)
    for (const w of SUSPICIOUS_WORDS) {
      if (name.includes(w) || normName.includes(normalize(w))) {
        return {
          isValid: false,
          reason: 'suspicious/fake/accessory'
        };
      }
    }
    // 2️⃣ ДОЛЖНО БЫТЬ СОВПАДЕНИЕ QUERY (если query — модель, ищем нормализованную подстроку)
    const normQuery = normalize(query);
    if (!normName.includes(normQuery)) {
      return {
        isValid: false,
        reason: 'query not found'
      };
    }
    // 3️⃣ КЛАСТЕРИЗАЦИЯ ПРИЗНАКОВ
    let features = 0;
    if (BRANDS.some(b => name.includes(b))) features++;
    if (SERIES.some(s => name.includes(s))) features++;
    if (FEATURES.some(f => name.includes(f))) features++;
    // 4️⃣ ДЛИНА НАЗВАНИЯ
    if (productName.length < 12) {
      return {
        isValid: false,
        reason: 'placeholder/too short'
      };
    }
    // 5️⃣ ДОЛЖНО БЫТЬ МИНИМУМ 2 ПРИЗНАКА
    if (features < 2) {
      return {
        isValid: false,
        reason: 'not enough features (need at least 2: brand, series, oem/box, freq, etc)'
      };
    }
    // 6️⃣ EDGE: если есть две разные модели (например, 7800x3d и 7950x3d), но не считать артикул
    const models = (name.replace(IGNORE_ARTICLE, '').match(MODEL_PATTERN) || []);
    const uniqueModels = Array.from(new Set(models));
    if (uniqueModels.length > 1) {
      return {
        isValid: false,
        reason: 'multiple models in name'
      };
    }
    // 7️⃣ OK
    return {
      isValid: true,
      reason: 'feature-clustered (brand/series/oem/box/freq)'
    };
  }
  extractModel(text: string): string {
    return '';
  }
} 