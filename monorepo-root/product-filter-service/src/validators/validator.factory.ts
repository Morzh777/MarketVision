import { BaseValidator } from './base.validator';
import { VideocardValidator } from './videocard.validator';
import { ProcessorsValidator } from './processors.validator';
import { NintendoSwitchValidator } from './nintendo-switch.validator';
import { PlaystationValidator } from './playstation.validator';
import { PlaystationAccessoriesValidator } from './playstation-accessories.validator';
import { MotherboardValidator } from './motherboard.validator';
import { ProductCategory } from './category.constants';

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
      case ProductCategory.Videocards:
        validator = new VideocardValidator();
        break;
      case ProductCategory.Processors:
        validator = new ProcessorsValidator();
        break;
      case ProductCategory.NintendoSwitch:
        validator = new NintendoSwitchValidator();
        break;
      case ProductCategory.Playstation:
        validator = new PlaystationValidator();
        break;
      case ProductCategory.PlaystationAccessories:
        validator = new PlaystationAccessoriesValidator();
        break;
      case ProductCategory.Motherboards:
        validator = new MotherboardValidator();
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