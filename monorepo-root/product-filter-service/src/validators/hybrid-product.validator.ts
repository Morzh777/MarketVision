import { isAccessory } from '../utils/is-accessory';
import { ACCESSORY_WORDS } from './accessory-words';
import { OpenAiValidationService, OpenAiProduct, OpenAiValidationResult } from '../services/openai.service';
import { VideocardValidator } from './videocard.validator';

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  aiReason?: string;
}

export class HybridProductValidator {
  private openai: OpenAiValidationService;
  private videocardValidator: VideocardValidator;
  constructor(openaiService: OpenAiValidationService) {
    this.openai = openaiService;
    this.videocardValidator = new VideocardValidator();
  }

  /**
   * Валидирует батч товаров одной категории/одного query.
   * Сначала accessory-words, потом обычный валидатор, только спорные — в OpenAI.
   * Возвращает массив результатов с explainability.
   */
  async validateBatch(products: OpenAiProduct[], category: string): Promise<ValidationResult[]> {
    // 1. Accessory-words фильтрация (жёсткая)
    const prefiltered: ValidationResult[] = products.map(p => {
      if (isAccessory(p.name)) {
        return { isValid: false, reason: 'accessory-words', aiReason: '' };
      }
      // soft accessory: если есть подозрительное слово — сразу в AI
      const norm = p.name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, ' ');
      const words = norm.split(' ');
      if (ACCESSORY_WORDS.some(word => words.includes(word))) {
        return { isValid: true, reason: 'soft-accessory', aiReason: '' };
      }
      return { isValid: true, reason: '', aiReason: '' };
    });
    // 2. Обычный валидатор (только для не аксессуаров и не soft-accessory)
    const codeResults: (ValidationResult | null)[] = products.map((p, i) => {
      if (!prefiltered[i].isValid || prefiltered[i].reason === 'soft-accessory') return null;
      const codeRes = this.videocardValidator.validate(p.query, p.name);
      if (codeRes.isValid) {
        return { isValid: true, reason: 'code', aiReason: '' };
      }
      return null; // спорные
    });
    // 3. Собираем спорные для AI (soft-accessory и обычные спорные)
    const toAI = products.filter((p, i) => (prefiltered[i].reason === 'soft-accessory') || (prefiltered[i].isValid && !codeResults[i]));
    let aiResults: OpenAiValidationResult[] = [];
    if (toAI.length > 0) {
      aiResults = await this.openai.validateProducts(toAI, category);
    }
    // 4. Собираем финальный результат
    let aiIdx = 0;
    return products.map((p, i) => {
      if (!prefiltered[i].isValid) {
        return prefiltered[i];
      }
      if (prefiltered[i].reason === 'soft-accessory' || !codeResults[i]) {
        const aiRes = aiResults[aiIdx++];
        return {
          isValid: aiRes.isValid,
          reason: 'ai',
          aiReason: aiRes.reason || ''
        };
      }
      return codeResults[i]!;
    });
  }
} 