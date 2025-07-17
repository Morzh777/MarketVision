import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class ProcessorsValidator extends ProductValidatorBase {
  private readonly PROCESSORS_RULES: ValidationRules = {
    modelPatterns: [
      /(?:AMD\s+)?Ryzen\s+(?:7\s+)?(\d{4}[Xx]?\d*)/i,
      /(?:Intel\s+)?Core\s+(?:i\d\s+)?(\d{4}[Kk]?[Ff]?)/
    ],
    accessoryWords: [
      'кулер', 'радиатор', 'вентилятор', 'термопаста', 'подставка', 'крепление',
      'материнская плата', 'память', 'ssd', 'hdd', 'видеокарта'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    const cases = [
      {
        when: () => category === 'processors',
        result: this.PROCESSORS_RULES
      }
    ];

    return cases.find(c => c.when())?.result ?? null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    const models = this.extractModels(name, rules.modelPatterns || []);

    const cases = [
      {
        when: () => rules.accessoryWords && this.isAccessory(name, rules.accessoryWords),
        result: { isValid: false, reason: 'accessory', confidence: 0.0 }
      },
      {
        when: () => this.validateModelMatch(query, models).isValid,
        result: { isValid: true, reason: 'model-match', confidence: 0.95 }
      }
    ];

    // DEBUG LOG
    console.log('[PROCESSOR VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return cases.find(c => c.when())?.result ?? { 
      isValid: false, 
      reason: 'no-model-match', 
      confidence: 0.1 
    };
  }

  /**
   * Переопределяем извлечение моделей для лучшей обработки процессоров
   */
  protected extractModels(name: string, patterns: RegExp[]): string[] {
    const models: string[] = [];
    
    // Извлекаем AMD Ryzen модели
    const ryzenMatch = name.match(/Ryzen\s*(?:7\s+)?(\d{4}[Xx]?\d*)/i);
    const ryzenCases = [
      {
        when: () => ryzenMatch !== null,
        result: () => {
          const model = ryzenMatch[1];
          models.push(model);
          // Добавляем нормализованную версию
          models.push(this.normalizeForQuery(`ryzen${model}`));
        }
      }
    ];
    ryzenCases.find(c => c.when())?.result();
    
    // Извлекаем Intel Core модели
    const coreMatch = name.match(/Core\s*(?:i\d\s+)?(\d{4}[Kk]?[Ff]?)/i);
    const coreCases = [
      {
        when: () => coreMatch !== null,
        result: () => {
          const model = coreMatch[1];
          models.push(model);
          // Добавляем нормализованную версию
          models.push(this.normalizeForQuery(`core${model}`));
        }
      }
    ];
    coreCases.find(c => c.when())?.result();
    
    // Извлекаем полные модели (например, 7800x3d)
    const fullModelMatch = name.match(/(\d{4}[Xx]\d+)/i);
    const fullModelCases = [
      {
        when: () => fullModelMatch !== null,
        result: () => {
          const model = fullModelMatch[1];
          models.push(model);
          // Добавляем нормализованную версию
          models.push(this.normalizeForQuery(model));
        }
      }
    ];
    fullModelCases.find(c => c.when())?.result();
    
    return Array.from(new Set(models)).filter(Boolean);
  }

  /**
   * Переопределяем метод валидации для процессоров с улучшенной логикой
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    // Используем метод нормализации из базового класса
    const normQuery = this.normalizeForQuery(query);
    
    const cases = [
      {
        when: () => models.includes(normQuery),
        result: { isValid: true, reason: 'model-match', confidence: 0.95 }
      },
      {
        when: () => {
          // Проверяем частичные совпадения для процессоров
          const queryParts = normQuery.split(/(\d+)/).filter(Boolean);
          return queryParts.some(part => 
            models.some(model => model.includes(part) || part.includes(model))
          );
        },
        result: { isValid: true, reason: 'model-match', confidence: 0.8 }
      }
    ];

    return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'no-model-match', confidence: 0.1 };
  }
} 