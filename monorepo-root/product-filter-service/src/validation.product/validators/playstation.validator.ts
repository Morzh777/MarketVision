/**
 * Уникальная логика валидации для категории playstation
 */
import { makeValidator } from '../utils/validation-utils';
import { ValidationReason } from '../unified-hybrid.validator';

export function playstationCustomValidator(query: string, name: string, rules: any) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();

  const accessoryRegexps = [
    /portal\s*remote\s*player/i,
    /remote\s*player/i,
    /portal\s*player/i,
    /portal[- ]?remote[- ]?player/i,
    /remote[- ]?player/i,
    /игров(ое|ая|ой)?\s*устройств(о|а|у|ом)?/i,
    /портативн(ая|ое|ой)?\s*(приставка|консоль)?/i,
    /portal/i,
    /remote/i,
    /player/i,
    /устройств(о|а|у|ом)?/i
  ];

  const cases = [
    {
      when: () => accessoryRegexps.some(re => re.test(n))
        || (n.includes('portal') && n.includes('player'))
        || (n.includes('portal') && n.includes('remote'))
        || n.includes('игровое устройство')
        || n.includes('устройство'),
      result: { isValid: false, reason: ValidationReason.Accessory, confidence: 0.9 }
    },
    {
      when: () => (rules.features || []).filter(f => n.includes(f)).length < (rules.minFeatures ?? 1),
      result: { isValid: false, reason: 'insufficient-features', confidence: 0.5 }
    },
    {
      when: () => q.includes('pro') && /ps5\s*pro|playstation\s*5\s*pro/.test(n),
      result: { isValid: true, reason: 'ps5-pro-match', confidence: 1.0 }
    },
    {
      when: () => q.includes('pro'),
      result: { isValid: false, reason: 'not-ps5-pro', confidence: 0.7 }
    },
    {
      when: () => /ps5\s*pro|playstation\s*5\s*pro/.test(n),
      result: { isValid: false, reason: 'is-ps5-pro', confidence: 0.9 }
    },
    {
      when: () => /ps5|playstation\s*5/.test(n),
      result: { isValid: true, reason: 'ps5-match', confidence: 1.0 }
    }
  ];

  return cases.find(c => c.when())?.result ?? { isValid: false, reason: 'uncertain', confidence: 0.3 };
}

export const validatePlaystation = makeValidator((query, name, rules) => playstationCustomValidator(query, name, rules)); 