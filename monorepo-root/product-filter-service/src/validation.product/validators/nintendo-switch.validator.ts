/**
 * Уникальная логика валидации для категории nintendo_switch
 */
import { normalizeForQuery, makeValidator } from '../utils/validation-utils';
import { ValidationReason } from '../unified-hybrid.validator';

export function customNintendoSwitchValidator(query: string, name: string, rules: any) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();

  const accessoryRegexps = [
    /сумк[аои]/i, /чехол/i, /кабель/i, /док-станц/i, /держател/i, /накле[йка]/i,
    /стекло/i, /пленк[аои]/i, /зарядк[аои]/i, /адаптер/i, /ремешок/i, /подставк[аои]/i,
    /корпус/i, /бокс/i, /провод/i, /сетев(ой|ая|ое)/i, /карта памяти/i, /джойстик/i,
    /геймпад/i, /контроллер/i, /руль/i, /стикер/i, /накладк[аои]/i, /перчатк[аои]/i,
    /перо/i, /стилус/i, /ремкомплект/i, /ремонтн/i, /ремонт/i, /дисплей/i, /экран/i,
    /крышк[аои]/i, /заглушк[аои]/i, /органайзер/i, /ремень/i, /мешок/i, /футляр/i,
    /usb/i, /hdmi/i, /bluetooth/i, /wi-?fi/i, /micro ?sd/i, /sd/i, /tf/i, /memory/i,
    /card/i, /reader/i, /зарядное/i, /устройство/i, /батаре[яи]/i, /аккумулятор/i,
    /power ?bank/i, /чистк[аои]/i, /салфетк[аои]/i
  ];

  const cases = [
    {
      when: () => accessoryRegexps.some(re => re.test(n)),
      result: { isValid: false, reason: ValidationReason.Accessory, confidence: 0.9 }
    },
    {
      when: () => (rules.features || []).filter(f => n.includes(f)).length < (rules.minFeatures ?? 1),
      result: { isValid: false, reason: 'insufficient-features', confidence: 0.5 }
    },
    {
      when: () => /switch\s*oled.*(2|2025|2024|2023|clone|клон|копия|pro|plus|ultra|new|новый|версия|вер\.|rev|рев|рем|ремонт|ремкомплект)/i.test(n)
        || /nintendo\s*switch\s*oled.*(2|2025|2024|2023|clone|клон|копия|pro|plus|ultra|new|новый|версия|вер\.|rev|рев|рем|ремонт|ремкомплект)/i.test(n),
      result: { isValid: false, reason: 'scam-oled-revision', confidence: 0.99 }
    },
    {
      when: () => q.includes('oled') && /switch\s*oled/.test(n),
      result: { isValid: true, reason: 'switch-oled-match', confidence: 1.0 }
    },
    {
      when: () => q.includes('lite') && /switch\s*lite/.test(n),
      result: { isValid: true, reason: 'switch-lite-match', confidence: 1.0 }
    },
    {
      when: () => /switch\s*2.*(рев|rev|рем|ремонт|ремкомплект|ревиз)/i.test(n),
      result: { isValid: false, reason: 'scam-revision', confidence: 0.99 }
    },
    {
      when: () => q.includes('2') && /switch\s*2/.test(n),
      result: { isValid: true, reason: 'switch-2-match', confidence: 1.0 }
    },
    {
      when: () => /switch\s*oled/.test(n),
      result: { isValid: false, reason: 'is-switch-oled', confidence: 0.9 }
    },
    {
      when: () => /switch\s*lite/.test(n),
      result: { isValid: false, reason: 'is-switch-lite', confidence: 0.9 }
    },
    {
      when: () => /switch\s*2/.test(n),
      result: { isValid: false, reason: 'is-switch-2', confidence: 0.9 }
    },
    {
      when: () => /nintendo\s*switch/.test(n),
      result: { isValid: true, reason: 'switch-match', confidence: 1.0 }
    }
  ];

  return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'uncertain', confidence: 0.3 };
}

export const validateNintendoSwitch = makeValidator((query, name, rules) => customNintendoSwitchValidator(query, name, rules)); 