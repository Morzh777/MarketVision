import { CategoryRule } from './category-rule.interface';
import { customVideocardValidator } from '../validators/videocards.validator';

export const VIDEOCARDS_RULES: CategoryRule = {
  name: ['видеокарта', 'graphics card', 'gpu'],
  brands: ['msi', 'palit', 'gigabyte', 'zotac', 'inno3d', 'asus', 'colorful', 'galax', 'maxsun', 'aorus', 'igame'],
  series: ['gaming', 'eagle', 'aorus', 'ventus', 'strix', 'tuf', 'phantom', 'x', 'xt', 'xtx', 'super', 'ultra', 'oc', 'plus'],
  features: ['rtx', 'gtx', 'rx', 'geforce', 'radeon'],
  minFeatures: 1,
  modelPatterns: [
    /(rtx|gtx|rx)[-\s]*(\d{4})(\s*(ti|super|ultra|xt|xtx|x|g|oc|plus))?/i
  ],
  customValidator: customVideocardValidator
};
