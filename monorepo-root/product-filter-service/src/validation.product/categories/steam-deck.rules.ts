import { CategoryRule } from './category-rule.interface';
import { steamDeckCustomValidator } from '../validators/steam-deck.validator';

export const STEAM_DECK_RULES: CategoryRule = {
  name: ['steam deck oled', 'steam deck'],
  brands: ['valve', 'steam'],
  series: ['oled', 'lcd', '512gb', '1tb', '256gb'],
  features: ['консоль', 'портативная', 'игровая', 'ssd', '1tb', '512gb', '256gb'],
  minFeatures: 1,
  modelPatterns: [
    /steam\s*deck\s*oled/i,
    /steam\s*deck/i
  ],
  customValidator: steamDeckCustomValidator,
  minNameLength: 5,
}; 