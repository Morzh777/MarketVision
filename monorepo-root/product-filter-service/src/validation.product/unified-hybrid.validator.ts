/**
 * UnifiedHybridValidator
 * ----------------------
 * Универсальный валидатор товаров для агрегатора (материнские платы, видеокарты и др.).
 * Использует каскадную стратегию: prefilter → code validation → AI validation.
 * - Строго типизирован.
 * - Логика feature extraction и accessory detection вынесена в отдельные методы.
 * - Использует best practices TypeScript/NestJS.
 * - Легко расширяем для новых категорий.
 *
 * @see VALIDATION_ARCHITECTURE_V2.md
 */

import { Injectable, Logger } from '@nestjs/common';
import { OpenAiValidationService, OpenAiProduct, OpenAiValidationResult } from '../services/openai.service';
// === ДЕКЛАРАТИВНОЕ ОПИСАНИЕ КАТЕГОРИЙ ===
import { MOTHERBOARDS_RULES } from './categories/motherboards.rules';
import { PROCESSORS_RULES } from './categories/processors.rules';
import { VIDEOCARDS_RULES } from './categories/videocards.rules';
import { PLAYSTATION_RULES } from './categories/playstation.rules';
import { NINTENDO_SWITCH_RULES } from './categories/nintendo-switch.rules';
import { STEAM_DECK_RULES } from './categories/steam-deck.rules';
// === ДЕКЛАРАТИВНЫЙ МАССИВ КАТЕГОРИЙ (только key и rules) ===
export const CATEGORY_DEFINITIONS = [
  { key: 'motherboards', rules: MOTHERBOARDS_RULES },
  { key: 'processors', rules: PROCESSORS_RULES },
  { key: 'videocards', rules: VIDEOCARDS_RULES },
  { key: 'playstation', rules: PLAYSTATION_RULES },
  { key: 'nintendo_switch', rules: NINTENDO_SWITCH_RULES },
  { key: 'steam_deck', rules: STEAM_DECK_RULES },
] as const;

// === АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ МАППИНГА ПРАВИЛ ===
const CATEGORY_RULES_MAP = Object.fromEntries(
  CATEGORY_DEFINITIONS.map(def => [def.key, def.rules])
);

export enum ValidationReason {
  PrefilterPassed = 'prefilter-passed',
  PriceAnomaly = 'price-anomaly',
  AccessoryWords = 'accessory-words',
  Accessory = 'accessory',
  SoftAccessory = 'soft-accessory',
  CodeValidated = 'code-validated',
  TooShort = 'too-short-for-auto-validation',
  SoftInsufficientFeatures = 'soft-insufficient-features',
  InsufficientFeatures = 'insufficient-features',
  ConflictingChipsets = 'conflicting-chipsets',
  NoQueryChipsetInName = 'no-query-chipset-in-name',
  AiValidated = 'ai-validated',
  ValidationFailed = 'validation-failed',
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  aiReason?: string;
  confidence?: number;
}

@Injectable()
export class UnifiedHybridValidator {
  private readonly logger = new Logger(UnifiedHybridValidator.name);

  constructor(private readonly openaiService: OpenAiValidationService) {}

  async validateBatch(
    products: ReadonlyArray<OpenAiProduct>,
    category: string
  ): Promise<ReadonlyArray<ValidationResult>> {
    const prefiltered = this.prefilterProducts(products, String(category));
    const codeValidated = this.codeValidation(prefiltered, String(category), products);

    const confident = codeValidated.map((r, i) => r && r.isValid ? { ...products[i], ...r } : null).filter(Boolean);

    if (confident.length > 0) {
      // Возвращаем результат для всех товаров (confident, аксессуары, невалидные), AI не вызываем
      return codeValidated.map((r, i) => {
        if (!r) return { ...products[i], isValid: false, reason: 'unknown', confidence: 0 };
        return { ...products[i], ...r };
      });
    }

    // Нет confident — только теперь отправляем в AI
    const toAI = this.collectForAI(codeValidated, prefiltered, products);
    let aiResults: OpenAiValidationResult[] = [];
    if (toAI.length > 0) {
      aiResults = await this.openaiService.validateProducts(toAI, String(category));
    }
    return this.assembleResults(products, prefiltered, codeValidated, aiResults);
  }

  private prefilterProducts(products: ReadonlyArray<OpenAiProduct>, category: string): ValidationResult[] {
    return products.map(product => {
      if (product.reason) {
        return { isValid: true, reason: product.reason, confidence: 1.0 };
      }
      if ((product as any).toAI === true || product.reason === ValidationReason.PriceAnomaly) {
        return { isValid: true, reason: ValidationReason.PriceAnomaly, confidence: 0.5 };
      }
      // accessory-логика теперь только в кастомных валидаторах
      return { isValid: true, reason: ValidationReason.PrefilterPassed, confidence: 0.5 };
    });
  }

  private codeValidation(
    prefiltered: ValidationResult[],
    category: string,
    products: ReadonlyArray<OpenAiProduct>
  ): (ValidationResult | null)[] {
    const rules = CATEGORY_RULES_MAP[String(category)];
    const validator = rules?.customValidator;
    if (!validator || !rules) {
      this.logger.warn(`⚠️ [UnifiedHybrid] Нет валидатора или правил для категории ${category}`);
      return prefiltered.map(() => null);
    }
    return prefiltered.map((preResult, index) => {
      if (!preResult.isValid || preResult.reason !== ValidationReason.PrefilterPassed) {
        return null;
      }
      const product = products[index];
      return validator(product.query, product.name, { ...rules, price: product.price, product });
    });
  }

  private collectForAI(
    codeValidated: (ValidationResult | null)[],
    prefiltered: ValidationResult[],
    products: ReadonlyArray<OpenAiProduct>
  ): OpenAiProduct[] {
    const toAI: OpenAiProduct[] = [];
    codeValidated.forEach((result, index) => {
      const product = products[index];
      const preResult = prefiltered[index];
      // Не отправлять аксессуары (prefiltered[index].reason === 'accessory-words' или 'аксессуар') в AI
      if (
        preResult && preResult.isValid === false &&
        (preResult.reason === ValidationReason.AccessoryWords || preResult.reason === ValidationReason.Accessory)
      ) {
        return;
      }
      if (
        product.reason === ValidationReason.PriceAnomaly ||
        result === null ||
        (result && [ValidationReason.PriceAnomaly, ValidationReason.SoftAccessory, ValidationReason.InsufficientFeatures].includes(result.reason as ValidationReason))
      ) {
        toAI.push(product);
      }
    });
    return toAI;
  }

  private assembleResults(
    products: ReadonlyArray<OpenAiProduct>,
    prefiltered: ValidationResult[],
    codeValidated: (ValidationResult | null)[],
    aiResults: OpenAiValidationResult[]
  ): any[] {
    let aiIndex = 0;
    return products.map((product, index) => {
      const preResult = prefiltered[index];
      const codeResult = codeValidated[index];
      if (!preResult.isValid) {
        return { ...product, ...preResult };
      }
      if (codeResult && codeResult.isValid) {
        return { ...product, ...codeResult };
      }
      if (
        preResult.reason === ValidationReason.PriceAnomaly ||
        preResult.reason === ValidationReason.SoftAccessory ||
        !codeResult
      ) {
        const aiResult = aiResults[aiIndex++];
        return {
          ...product,
          isValid: aiResult.isValid,
          reason: ValidationReason.AiValidated,
          aiReason: aiResult.reason || '',
          confidence: 0.8
        };
      }
      return { ...product, isValid: false, reason: ValidationReason.ValidationFailed, confidence: 0.3 };
    });
  }
} 