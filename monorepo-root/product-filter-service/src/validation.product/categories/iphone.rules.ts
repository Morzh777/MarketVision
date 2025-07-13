import { CategoryRule } from './category-rule.interface';
import { customIphoneValidator } from '../validators/iphone.validators';

export const IPHONE_RULES: CategoryRule = {
  name: ['iphone', 'айфон'],
  brands: ['apple'],
  series: [
    '16 pro', '16', '15 pro', '15', '14 pro', '14', '13 pro', '13', '12 pro', '12', '11 pro', '11', 'se'
  ],
  features: ['pro', 'max', 'mini', 'plus', 'oled', 'retina', '5g', '128gb', '256gb', '512gb', '1tb', 'гб', 'тб'],
  minFeatures: 1,
  modelPatterns: [
    /iphone\s?1[1-6]\s?(pro|max|plus|mini)?/i,
    /iphone\s?se/i
  ],
  customValidator: customIphoneValidator,
  minNameLength: 5
};