import { CategoryRule } from './category-rule.interface';
import { customProcessorValidator } from '../validators/processors.validator';

export const PROCESSORS_RULES: CategoryRule = {
  name: ['процессор', 'cpu', 'processor'],
  brands: ['amd', 'intel', 'ryzen', 'xeon', 'core', 'pentium', 'celeron'],
  series: ['ryzen', 'core', 'i3', 'i5', 'i7', 'i9', 'x3d', 'hx'],
  features: ['am5', 'am4', 'lga1700', 'lga1200', 'ddr5', 'ddr4', 'cache', 'boost', 'threads', 'cores'],
  minFeatures: 1,
  modelPatterns: [
    /9(950|900|800|700|600)X3D?/gi,
    /9(950|900|800|700|600)X/gi,
    /9(950|900|800|700|600)HX3D?/gi,
    /7[5689]00x3d|7950x3d|7600x3d/gi,
    /(i[3579])-?\d{4,5}[a-z]*/i,
    /ryzen\s*([3579])\s*(\d{4})[a-z]*/i
  ],
  customValidator: customProcessorValidator
};
