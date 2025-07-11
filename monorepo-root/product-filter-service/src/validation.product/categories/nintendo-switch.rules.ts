import { CategoryRule } from './category-rule.interface';
import { customNintendoSwitchValidator } from '../validators/nintendo-switch.validator';

export const NINTENDO_SWITCH_RULES: CategoryRule = {
  name: ['nintendo switch', 'switch', 'oled'],
  brands: ['nintendo'],
  series: ['oled', 'lite', 'standard', 'neon', 'gray'],
  features: ['консоль', '32gb', '64gb', 'игровая', 'портативная'],
  minFeatures: 1,
  customValidator: customNintendoSwitchValidator
};
