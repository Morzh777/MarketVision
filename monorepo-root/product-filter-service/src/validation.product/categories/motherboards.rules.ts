import { CategoryRule } from './category-rule.interface';
import { customMotherboardValidator } from '../validators/motherboards.validator';

export const MOTHERBOARDS_RULES: CategoryRule = {
  name: ['материнская плата', 'motherboard'],
  brands: [
    'asus', 'msi', 'gigabyte', 'asrock', 'biostar', 'aorus', 'evga',
    'maxsun', 'ms', 'colorful', 'supermicro', 'foxconn', 'jetway', 'ecs', 'dfi', 'zotac',
    'материнская плата'
  ],
  series: [
    'gaming x', 'aorus', 'pro rs', 'steel legend', 'tomahawk', 'phantom', 'unify', 'creator',
    'tuf', 'prime', 'eagle', 'carbon', 'lightning', 'terminator', 'pro', 'ds3h', 'd3hp', 'force', 'nitro', 'riptide', 'ayw', 'battle-ax', 'plus', 'legend', 'rs', 'elite', 'frozen', 'wifi', 'ice'
  ],
  features: ['ddr5', 'ddr4', 'pcie', 'wifi', 'bluetooth', 'usb3', 'sata', 'nvme', 'm.2'],
  minFeatures: 1,
  chipsets: [
    'z990', 'z890', 'z790', 'b860', 'b850', 'b760', 'h810', 'w880', 'b760m', 'b760m-k',
    'x950', 'x870e', 'x870', 'a820', 'b850mt2-e', 'b850mt2-a', 'b850mt2-d', 'b850mt2-c', 'b850mt2-b', 'B850M-X', 'B850M'
  ],
  customValidator: customMotherboardValidator
};

// Список платформ/сокетов (не участвуют в конфликте чипсетов)
export const MOTHERBOARD_PLATFORMS = [
  'am5', 'am4', 'lga1700', 'lga1200', 'lga1151', 'lga1150', 'lga1155', 'lga2011', 'lga2066', 'lga1366', 'lga775',
  'socket 1700', 'socket 1200', 'socket 1151', 'socket 1150', 'socket 1155', 'socket 2011', 'socket 2066', 'socket 1366', 'socket 775'
] as const;
