import { BaseValidator, ValidationResult } from './base.validator';
import { isAccessory } from '../utils/is-accessory';

const BRANDS = [
  'msi', 'palit', 'gigabyte', 'zotac', 'inno3d', 'asus', 'colorful', 'galax', 'maxsun', 'aorus', 'igame'
];
const SERIES = [
  'gaming', 'oc', 'ventus', 'windforce', 'prime', 'aorus', 'tuf', 'gamingpro', 'solid core', 'vulcan', 'trio', 'shadow', 'inspire'
];
const MEMORY = [
  '16gb', '16 гб', '24gb', '24 гб'
];
const MODEL_ARTICLE = /\b([a-z]{2,4}-)?rtx5080[a-z0-9\-]*\b|[a-z]{2,4}[0-9]{6,}/i;

export class VideocardValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    const lower = productName.toLowerCase();
    // 0️⃣ ФИЛЬТРАЦИЯ АКСЕССУАРОВ
    if (isAccessory(productName)) {
      return {
        isValid: false,
        reason: 'аксессуар'
      };
    }
    // 1️⃣ Должно быть RTX 5080 (или слитно)
    if (!/rtx\s*5080/i.test(lower)) {
      return {
        isValid: false,
        reason: 'Нет RTX 5080 в названии'
      };
    }
    // 2️⃣ Кластеризация по признакам
    const hasBrand = BRANDS.some(b => lower.includes(b));
    const hasSeries = SERIES.some(s => lower.includes(s));
    const hasMemory = MEMORY.some(m => lower.includes(m));
    const hasModelArticle = MODEL_ARTICLE.test(lower);
    const count = [hasBrand, hasSeries, hasMemory, hasModelArticle].filter(Boolean).length;
    if (count < 2) {
      return {
        isValid: false,
        reason: 'Недостаточно признаков настоящей видеокарты (бренд/серия/память/артикул)'
      };
    }
    // 3️⃣ Название не должно быть слишком коротким
    if (productName.replace(/\s+/g, '').length < 15) {
      return {
        isValid: false,
        reason: 'Слишком короткое название для настоящей видеокарты'
      };
    }
    // 4️⃣ Базовые проверки (query/model)
    if (this.simpleMatch(query, productName) || this.modelMatch(query, productName)) {
      return {
        isValid: true,
        reason: 'Похоже на настоящую видеокарту (кластеризация признаков)'
      };
    }
    return {
      isValid: false,
      reason: 'Не соответствует кластеру настоящих видеокарт'
    };
  }

  extractModel(text: string): string | null {
    const normalizedText = this.normalizeText(text);
    // Паттерны для поиска ПОЛНЫХ моделей видеокарт
    const patterns = [
      /RTX\s*(\d{4})\s*(TI|SUPER|ULTRA)?/i,      // RTX 5070 Ti, RTX 5070 Super, RTX 5070
      /GTX\s*(\d{4})\s*(TI|SUPER|ULTRA)?/i,      // GTX 1660 Ti, GTX 1660 Super, GTX 1660
      /RX\s*(\d{4})\s*(XT|XTX|G)?/i,             // RX 7900 XT, RX 7900 XTX, RX 7900
      /(\d{4})\s*(TI|SUPER|ULTRA|XT|XTX|G)?/i,   // 5070 Ti, 5070 Super, 5070
      /(\d{4})(TI|SUPER|ULTRA|XT|XTX|G)/i        // 5070TI, 5070Super, 5070XT (БЕЗ пробела)
    ];
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const baseModel = match[1]; // 5070
        const suffix = match[2] || ''; // Ti, Super, XT, etc.
        if (suffix) {
          return `${baseModel} ${suffix.toUpperCase()}`; // "5070 TI"
        } else {
          return baseModel; // "5070"
        }
      }
    }
    return null;
  }
} 