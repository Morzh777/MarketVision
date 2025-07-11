/**
 * Уникальная логика валидации для категории playstation
 */
import { makeValidator } from '../utils/validation-utils';
import { ValidationReason } from '../unified-hybrid.validator';

export function playstationCustomValidator(query: string, name: string, rules: any) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();

  // 1. Аксессуарный фильтр (includes + regexp + кейсы)
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
  const isAccessory =
    accessoryRegexps.some(re => re.test(n)) ||
    (n.includes('portal') && n.includes('player')) ||
    (n.includes('portal') && n.includes('remote')) ||
    n.includes('игровое устройство') ||
    n.includes('устройство');
  if (isAccessory) {
    console.log('[ACCESSORY DETECTED]', { name });
    return { isValid: false, reason: ValidationReason.Accessory, confidence: 0.9 };
  }

  // 2. minFeatures
  const featuresFound = (rules.features || []).filter(f => n.includes(f)).length;
  if (featuresFound < (rules.minFeatures ?? 1)) {
    return { isValid: false, reason: 'insufficient-features', confidence: 0.5 };
  }

  // 3. Явные паттерны (PS5/Pro)
  if (q.includes('pro') && /ps5\s*pro|playstation\s*5\s*pro/.test(n)) {
    return { isValid: true, reason: 'ps5-pro-match', confidence: 1.0 };
  }
  if (q.includes('pro')) {
    return { isValid: false, reason: 'not-ps5-pro', confidence: 0.7 };
  }
  if (/ps5\s*pro|playstation\s*5\s*pro/.test(n)) {
    return { isValid: false, reason: 'is-ps5-pro', confidence: 0.9 };
  }
  if (/ps5|playstation\s*5/.test(n)) {
    return { isValid: true, reason: 'ps5-match', confidence: 1.0 };
  }

  // 4. Не уверен — отправить в AI
  return { isValid: false, reason: 'uncertain', confidence: 0.3 };
}

export const validatePlaystation = makeValidator((query, name, rules) => playstationCustomValidator(query, name, rules)); 