import { BaseValidator } from './base.validator';
import { VideocardValidator } from './videocard.validator';

export class ValidatorFactory {
  private static validators: Map<string, BaseValidator> = new Map();
  
  static getValidator(category: string): BaseValidator | null {
    // Проверяем кеш
    if (this.validators.has(category)) {
      return this.validators.get(category)!;
    }
    
    // Создаем валидатор
    let validator: BaseValidator | null = null;
    
    switch (category) {
      case 'videocards':
        validator = new VideocardValidator();
        break;
      // TODO: Добавить другие категории
      // case 'processors':
      //   validator = new ProcessorValidator();
      //   break;
      // case 'smartphones':
      //   validator = new SmartphoneValidator();
      //   break;
      default:
        return null;
    }
    
    // Кешируем валидатор
    if (validator) {
      this.validators.set(category, validator);
    }
    
    return validator;
  }
  
  static clearCache(): void {
    this.validators.clear();
  }
} 