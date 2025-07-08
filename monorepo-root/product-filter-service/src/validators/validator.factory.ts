import { BaseValidator } from './base.validator';
import { VideocardValidator } from './videocard.validator';
import { ProcessorsValidator } from './processors.validator';
import { NintendoSwitchValidator } from './nintendo-switch.validator';
import { PlaystationValidator } from './playstation.validator';
import { PlaystationAccessoriesValidator } from './playstation-accessories.validator';

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
      case 'processors':
        validator = new ProcessorsValidator();
        break;
      case 'nintendo_switch':
        validator = new NintendoSwitchValidator();
        break;
      case 'playstation':
        validator = new PlaystationValidator();
        break;
      case 'playstation_accessories':
        validator = new PlaystationAccessoriesValidator();
        break;
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