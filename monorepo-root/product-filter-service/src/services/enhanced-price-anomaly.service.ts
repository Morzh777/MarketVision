import { Injectable, Logger } from '@nestjs/common';

export interface PriceAnomalyConfig {
  // Минимальная разница в процентах для считывания как аномалия
  minPercentageDifference: number;
  // Минимальное количество товаров для анализа
  minProductsForAnalysis: number;
  // Максимальная цена для считывания дешёвого товара подозрительным
  maxSuspiciousPrice: number;
  // Статистические пороги
  zScoreThreshold: number;
  iqrMultiplier: number;
}

const DEFAULT_CONFIG: PriceAnomalyConfig = {
  minPercentageDifference: 0.3, // 30%
  minProductsForAnalysis: 2,
  maxSuspiciousPrice: 1000, // до 1000 рублей считается подозрительно дешёвым
  zScoreThreshold: 2.0, // стандартных отклонений
  iqrMultiplier: 1.5
};

// Конфигурация для разных категорий
const CATEGORY_CONFIGS: Record<string, Partial<PriceAnomalyConfig>> = {
  videocards: {
    minPercentageDifference: 0.4, // видеокарты имеют больший разброс цен
    maxSuspiciousPrice: 5000,
    zScoreThreshold: 2.5
  },
  processors: {
    minPercentageDifference: 0.35,
    maxSuspiciousPrice: 3000,
    zScoreThreshold: 2.0
  },
  motherboards: {
    minPercentageDifference: 0.3,
    maxSuspiciousPrice: 2000,
    zScoreThreshold: 2.0
  },
  playstation: {
    minPercentageDifference: 0.25, // консоли имеют более стабильные цены
    maxSuspiciousPrice: 10000,
    zScoreThreshold: 1.8
  },
  nintendo_switch: {
    minPercentageDifference: 0.25,
    maxSuspiciousPrice: 8000,
    zScoreThreshold: 1.8
  }
};

export interface AnomalyDetectionResult {
  anomalousProducts: Array<{
    id: string;
    price: number;
    anomalyType: 'statistical_outlier' | 'too_cheap' | 'percentage_difference';
    confidence: number;
    explanation: string;
  }>;
  statistics: {
    mean: number;
    median: number;
    std: number;
    q1: number;
    q3: number;
    iqr: number;
    priceRange: { min: number; max: number };
  };
}

@Injectable()
export class EnhancedPriceAnomalyService {
  private readonly logger = new Logger(EnhancedPriceAnomalyService.name);

  /**
   * Обнаружение аномальных цен с использованием множественных методов
   */
  detectAnomalies(products: any[], category: string): AnomalyDetectionResult {
    if (products.length < 2) {
      return this.createEmptyResult();
    }

    const config = this.getConfigForCategory(category);
    const prices = products.map(p => p.price).filter(p => p > 0);
    
    if (prices.length < config.minProductsForAnalysis) {
      return this.createEmptyResult();
    }

    // Вычисляем статистики
    const statistics = this.calculateStatistics(prices);

    // Новый best practice: фильтрация по IQR и trimmed mean
    const iqrFilteredPrices = this.getIQRFilteredPrices(prices, statistics.q1, statistics.q3, statistics.iqr);
    const trimmedMean = this.getTrimmedMean(iqrFilteredPrices, 0.1);
    const robustMedian = this.getMedian(iqrFilteredPrices);

    const anomalousProducts: AnomalyDetectionResult['anomalousProducts'] = [];

    // Метод 1: Статистические выбросы (Z-score) — теперь относительно trimmedMean
    const zScoreAnomalies = this.detectZScoreAnomalies(products, { ...statistics, mean: trimmedMean, std: statistics.std }, config);
    anomalousProducts.push(...zScoreAnomalies);

    // Метод 2: IQR (Interquartile Range)
    const iqrAnomalies = this.detectIQRAnomalies(products, statistics, config);
    anomalousProducts.push(...iqrAnomalies);

    // Метод 3: Процентная разница (оригинальный метод)
    const percentageAnomalies = this.detectPercentageAnomalies(products, config);
    anomalousProducts.push(...percentageAnomalies);

    // Метод 4: Подозрительно дешёвые товары
    const tooChеapAnomalies = this.detectTooChеapProducts(products, config, category);
    anomalousProducts.push(...tooChеapAnomalies);

    // Удаляем дубликаты и выбираем лучшие аномалии
    const uniqueAnomalies = this.removeDuplicatesAndRank(anomalousProducts);

    this.logger.log(
      `🔍 [PriceAnomaly] Категория: ${category}, товаров: ${products.length}, ` +
      `аномалий: ${uniqueAnomalies.length}, trimmedMean по IQR: ${trimmedMean.toFixed(0)}₽, медиана по IQR: ${robustMedian.toFixed(0)}₽, IQR: [${statistics.q1.toFixed(0)}, ${statistics.q3.toFixed(0)}]`
    );

    return {
      anomalousProducts: uniqueAnomalies,
      statistics: {
        ...statistics,
        mean: trimmedMean, // для обратной совместимости
        median: robustMedian
      }
    };
  }

  /**
   * Получение конфигурации для категории
   */
  private getConfigForCategory(category: string): PriceAnomalyConfig {
    const categoryConfig = CATEGORY_CONFIGS[category] || {};
    return { ...DEFAULT_CONFIG, ...categoryConfig };
  }

  /**
   * Вычисление статистик цен
   */
  private calculateStatistics(prices: number[]) {
    const sorted = [...prices].sort((a, b) => a - b);
    const n = sorted.length;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / n;
    const median = n % 2 === 0 
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
      : sorted[Math.floor(n/2)];
    
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    return {
      mean,
      median,
      std,
      q1,
      q3,
      iqr,
      priceRange: { min: sorted[0], max: sorted[n-1] }
    };
  }

  /**
   * Обнаружение аномалий по Z-score
   */
  private detectZScoreAnomalies(products: any[], statistics: any, config: PriceAnomalyConfig) {
    const anomalies: AnomalyDetectionResult['anomalousProducts'] = [];
    
    for (const product of products) {
      if (product.price <= 0) continue;
      
      const zScore = Math.abs((product.price - statistics.mean) / statistics.std);
      
      if (zScore > config.zScoreThreshold) {
        const confidence = Math.min(0.95, zScore / config.zScoreThreshold * 0.7);
        anomalies.push({
          id: product.id,
          price: product.price,
          anomalyType: 'statistical_outlier',
          confidence,
          explanation: `Z-score: ${zScore.toFixed(2)} (порог: ${config.zScoreThreshold})`
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Обнаружение аномалий по IQR
   */
  private detectIQRAnomalies(products: any[], statistics: any, config: PriceAnomalyConfig) {
    const anomalies: AnomalyDetectionResult['anomalousProducts'] = [];
    const lowerBound = statistics.q1 - (config.iqrMultiplier * statistics.iqr);
    const upperBound = statistics.q3 + (config.iqrMultiplier * statistics.iqr);
    
    for (const product of products) {
      if (product.price <= 0) continue;
      
      if (product.price < lowerBound || product.price > upperBound) {
        const distanceFromBound = product.price < lowerBound 
          ? lowerBound - product.price 
          : product.price - upperBound;
        const confidence = Math.min(0.9, distanceFromBound / statistics.iqr * 0.5);
        
        anomalies.push({
          id: product.id,
          price: product.price,
          anomalyType: 'statistical_outlier',
          confidence,
          explanation: `IQR выброс: цена ${product.price < lowerBound ? 'ниже' : 'выше'} границ [${lowerBound.toFixed(0)}, ${upperBound.toFixed(0)}]`
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Обнаружение аномалий по процентной разнице (оригинальный метод)
   */
  private detectPercentageAnomalies(products: any[], config: PriceAnomalyConfig) {
    const anomalies: AnomalyDetectionResult['anomalousProducts'] = [];
    
    if (products.length < 2) return anomalies;
    
    const sorted = [...products].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0];
    const secondCheapest = sorted[1];
    
    if (secondCheapest.price > 0) {
      const difference = (secondCheapest.price - cheapest.price) / secondCheapest.price;
      
      if (difference > config.minPercentageDifference) {
        anomalies.push({
          id: cheapest.id,
          price: cheapest.price,
          anomalyType: 'percentage_difference',
          confidence: Math.min(0.9, difference * 1.5),
          explanation: `${(difference * 100).toFixed(1)}% дешевле следующего товара (${secondCheapest.price}₽)`
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Обнаружение подозрительно дешёвых товаров
   */
  private detectTooChеapProducts(products: any[], config: PriceAnomalyConfig, category: string) {
    const anomalies: AnomalyDetectionResult['anomalousProducts'] = [];
    
    for (const product of products) {
      if (product.price > 0 && product.price < config.maxSuspiciousPrice) {
        // Дополнительная проверка: если это действительно может быть такая цена
        const suspicionLevel = this.calculateSuspicionLevel(product, category);
        
        if (suspicionLevel > 0.6) {
          anomalies.push({
            id: product.id,
            price: product.price,
            anomalyType: 'too_cheap',
            confidence: suspicionLevel,
            explanation: `Подозрительно низкая цена для категории ${category}: ${product.price}₽`
          });
        }
      }
    }
    
    return anomalies;
  }

  /**
   * Расчёт уровня подозрения для дешёвого товара
   */
  private calculateSuspicionLevel(product: any, category: string): number {
    let suspicion = 0;
    
    // Проверяем на ключевые слова, которые могут означать, что это не полный товар
    const suspiciousWords = [
      'запчасть', 'деталь', 'ремонт', 'б/у', 'поломанный', 'нерабочий',
      'for parts', 'broken', 'repair', 'spare', 'used'
    ];
    
    const name = product.name.toLowerCase();
    const hasSuspiciousWords = suspiciousWords.some(word => name.includes(word));
    
    if (hasSuspiciousWords) {
      return 0.2; // Низкая подозрительность, если есть объяснение низкой цены
    }
    
    // Базовая подозрительность в зависимости от категории и цены
    const categoryBasePrices: Record<string, number> = {
      videocards: 15000,
      processors: 8000,
      motherboards: 5000,
      playstation: 40000,
      nintendo_switch: 25000
    };
    
    const basePrice = categoryBasePrices[category] || 5000;
    const priceRatio = product.price / basePrice;
    
    if (priceRatio < 0.1) suspicion += 0.8; // Меньше 10% от базовой цены
    else if (priceRatio < 0.2) suspicion += 0.6; // Меньше 20%
    else if (priceRatio < 0.3) suspicion += 0.4; // Меньше 30%
    
    return Math.min(1.0, suspicion);
  }

  /**
   * Удаление дубликатов и ранжирование аномалий
   */
  private removeDuplicatesAndRank(anomalies: AnomalyDetectionResult['anomalousProducts']) {
    // Группируем по ID товара
    const grouped = new Map<string, AnomalyDetectionResult['anomalousProducts'][0]>();
    
    for (const anomaly of anomalies) {
      const existing = grouped.get(anomaly.id);
      if (!existing || anomaly.confidence > existing.confidence) {
        grouped.set(anomaly.id, anomaly);
      }
    }
    
    // Сортируем по confidence (убывание)
    return Array.from(grouped.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Создание пустого результата
   */
  private createEmptyResult(): AnomalyDetectionResult {
    return {
      anomalousProducts: [],
      statistics: {
        mean: 0,
        median: 0,
        std: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        priceRange: { min: 0, max: 0 }
      }
    };
  }

  // --- Новый код для trimmed mean и IQR ---
  private getIQRFilteredPrices(prices: number[], q1: number, q3: number, iqr: number) {
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return prices.filter(p => p >= lower && p <= upper);
  }

  private getTrimmedMean(prices: number[], trimPercent = 0.1) {
    if (prices.length === 0) return 0;
    const sorted = [...prices].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * trimPercent);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
    if (trimmed.length === 0) return this.getMedian(sorted);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }

  private getMedian(prices: number[]) {
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
} 