/**
 * CategoryRule — стандарт описания правил валидации для товарной категории.
 * Все категории должны реализовывать этот интерфейс для единообразия и автодополнения.
 *
 * @property name — ключевые слова-синонимы категории (например, 'материнская плата', 'motherboard')
 * @property brands — список брендов, относящихся к категории
 * @property series — серии/модели, характерные для категории
 * @property features — важные характеристики (например, 'ddr5', 'wifi')
 * @property minFeatures — минимальное количество признаков для автоматической валидации
 * @property modelPatterns — (опционально) регулярки для поиска моделей
 * @property minNameLength — (опционально) минимальная длина названия для валидации
 * @property customValidator — (опционально) функция для уникальной логики валидации
 */
export interface CategoryRule {
  name?: readonly string[];
  brands?: readonly string[];
  series?: readonly string[];
  features?: readonly string[];
  minFeatures: number;
  modelPatterns?: readonly RegExp[];
  minNameLength?: number;
  chipsets?: readonly string[];
  customValidator?: (query: string, productName: string, rules: any) => { isValid: boolean; reason: string; confidence: number };
} 