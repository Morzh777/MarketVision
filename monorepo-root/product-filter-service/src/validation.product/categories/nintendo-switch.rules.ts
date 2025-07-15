import { CategoryRule } from './category-rule.interface';
import { customNintendoSwitchValidator } from '../validators/nintendo-switch.validator';

export const NINTENDO_SWITCH_RULES: CategoryRule = {
  name: ['nintendo switch 2','nintendo switch oled'],
  brands: ['nintendo'],
  series: ['oled', 'lite', 'standard', 'neon', 'gray'],
  features: ['консоль', '32gb', '64gb', 'игровая', 'портативная'],
  minFeatures: 1,
  modelPatterns: [
    /switch\s*oled/i,
    /switch\s*lite/i,
    /switch\s*2/i,
    /nintendo\s*switch/i
  ],
  customValidator: customNintendoSwitchValidator
};
