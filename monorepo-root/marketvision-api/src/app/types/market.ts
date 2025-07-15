export interface MockHourlyCheapestItem {
  hour: string;
  name: string;
  price: number;
  image: string;
  link: string;
  source: string;
  marketPriceNote?: string;
  qwerty?: string;
  recommended?: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  iqr?: [number, number];
  category?: string;
}

export type Timeframe = 'day' | 'week' | 'month' | 'year'; 