import { makeValidator } from '../utils/validation-utils';
import { ValidationReason } from '../unified-hybrid.validator';

export function steamDeckCustomValidator(query: string, name: string, rules: any) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();

  const accessoryRegexps = [
    /чехол/i, /кабель/i, /док-станц/i, /держател/i, /наклейка/i, /стекло/i, /пленка/i,
    /зарядк[аои]/i, /адаптер/i, /подставк[аои]/i, /корпус/i, /бокс/i, /провод/i,
    /сетев(ой|ая|ое)/i, /карта памяти/i, /геймпад/i, /контроллер/i, /руль/i, /стикер/i,
    /накладк[аои]/i, /перчатк[аои]/i, /перо/i, /стилус/i, /ремкомплект/i, /ремонт/i,
    /дисплей/i, /экран/i, /крышк[аои]/i, /заглушк[аои]/i, /органайзер/i, /ремень/i,
    /мешок/i, /футляр/i, /usb/i, /hdmi/i, /bluetooth/i,/memory/i, /card/i,
    /reader/i, /зарядное/i, /устройство/i, /батаре[яи]/i, /аккумулятор/i, /power ?bank/i
  ];

  const cases = [
    // --- ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА --- (ставим первой!)
    {
      when: () => {
        const hasSteamDeck = /steam\s*deck/.test(n);
        const hasOled = /oled/.test(n);
        const hasScreen = /экран|дисплей/.test(n);
        const hasConsole = /консоль|игровая|приставка/.test(n);
        const hasBigMemory = /(512\s*гб|512gb|1\s*тб|1tb)/i.test(n);
        return hasSteamDeck && hasOled && hasScreen && (hasConsole || hasBigMemory);
      },
      result: { isValid: true, reason: 'steam-deck-oled-match', confidence: 0.95 }
    },
    // accessoryRegexps теперь ниже
    {
      when: () => accessoryRegexps.some(re => re.test(n)),
      result: { isValid: false, reason: ValidationReason.Accessory, confidence: 0.9 }
    },
    {
      when: () => (rules.features || []).filter(f => n.includes(f)).length < (rules.minFeatures ?? 1),
      result: { isValid: false, reason: 'insufficient-features', confidence: 0.5 }
    },
    {
      when: () => /steam\s*deck.*(clone|клон|копия|pro|plus|ultra|new|новый|версия|rev|рев|рем|ремонт|ремкомплект)/i.test(n),
      result: { isValid: false, reason: 'scam-revision', confidence: 0.99 }
    },
    {
      when: () => /steam\s*deck\s*oled/.test(n),
      result: { isValid: true, reason: 'steam-deck-oled-match', confidence: 1.0 }
    },
    {
      when: () => /steam\s*deck/.test(n),
      result: { isValid: true, reason: 'steam-deck-match', confidence: 1.0 }
    }
  ];

  return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'uncertain', confidence: 0.3 };
}

export const validateSteamDeck = makeValidator((query, name, rules) => steamDeckCustomValidator(query, name, rules)); 