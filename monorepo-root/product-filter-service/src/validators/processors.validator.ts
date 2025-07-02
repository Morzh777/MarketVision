import { BaseValidator, ValidationResult } from './base.validator';

export class ProcessorsValidator extends BaseValidator {
  validate(query: string, productName: string): ValidationResult {
    // 1️⃣ ПРОСТАЯ ПРОВЕРКА: ищем запрос в названии товара
    if (this.simpleMatch(query, productName)) {
      return { 
        isValid: true, 
        reason: 'Соответствует запросу' 
      };
    }
    
    // 2️⃣ СТРОГАЯ ПРОВЕРКА: сравниваем модель и суффикс
    const queryModel = this.extractCpuModel(query);
    const productModel = this.extractCpuModel(productName);
    if (queryModel && productModel && this.strictModelMatch(queryModel, productModel)) {
      return { 
        isValid: true, 
        reason: 'Точное совпадение модели процессора' 
      };
    }
    
    return { 
      isValid: false, 
      reason: 'Не соответствует запросу' 
    };
  }

  extractCpuModel(text: string): { model: string, suffix: string } | null {
    const normalizedText = this.normalizeText(text);
    // AMD Ryzen
    const pattern = /ryzen\s*(\d+)\s*(\d{4})([xх]\s*3d|[xх]3d|3d|[xх])?/i;
    const match = normalizedText.match(pattern);
    if (match) {
      const model = match[2];
      let suffix = (match[3] || '').toUpperCase().replace(/Х/g, 'X').replace(/\s+/g, '');
      // Приводим к стандарту: X3D, X, 3D, ''
      if (suffix === 'X3D' || suffix === 'X 3D') suffix = 'X3D';
      else if (suffix === '3D') suffix = '3D';
      else if (suffix === 'X') suffix = 'X';
      else suffix = '';
      return { model, suffix };
    }
    return null;
  }

  strictModelMatch(a: { model: string, suffix: string }, b: { model: string, suffix: string }): boolean {
    return a.model === b.model && a.suffix === b.suffix;
  }

  // Для совместимости с BaseValidator (не используется)
  extractModel(text: string): string {
    return '';
  }
} 