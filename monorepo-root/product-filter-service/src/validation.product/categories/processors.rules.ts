import { CategoryRule } from './category-rule.interface';
import { customProcessorValidator } from '../validators/processors.validator';

export const PROCESSORS_RULES: CategoryRule = {
  name: ['процессор', 'cpu', 'processor'],
  brands: ['amd', 'intel', 'ryzen', 'xeon', 'core', 'pentium', 'celeron'],
  series: ['ryzen', 'core', 'i3', 'i5', 'i7', 'i9', 'x3d', 'hx'],
  features: ['am5', 'am4', 'lga1700', 'lga1200', 'ddr5', 'ddr4', 'cache', 'boost', 'threads', 'cores'],
  minFeatures: 1,
  modelPatterns: [
    /(\d{4,5}\s*x\s*3d)/gi,   // 7800x3d, 7800x 3d, 7800 x3d и т.д.
    /(\d{4,5}\s*hx)/gi,        // 7945hx, 7945 hx
    /(\d{4,5}\s*x)/gi,         // 7800x, 7800 x
    /(i[3579]-?\d{4,5}[a-z]*)/i, // i7-14700k, i9-13900hx и т.д.
    /ryzen\s*[3579]\s*(\d{4}[a-z]*)/i // ryzen 7 7800x3d
  ],
  customValidator: customProcessorValidator
};
