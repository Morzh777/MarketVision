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

export type SortOrder = 'asc' | 'desc' | null;

export interface PriceHistoryItem {
  price: number | null;
  created_at: string;
}

export interface ProductCardProps {
  product: {
    name: string;
    price: number;
    image?: string;
    source?: string;
    url?: string;
    hour?: string;
    marketPriceNote?: string;
    recommended?: number;
    min?: number;
    max?: number;
    mean?: number;
    category?: string;
    qwerty?: string;
  } | null;
}

export interface ChartBlockProps {
  selected: MockHourlyCheapestItem;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  priceHistory: PriceHistoryItem[];
  recommended: number | null;
}

export interface SidebarProps {
  products: MockHourlyCheapestItem[];
  selected: MockHourlyCheapestItem;
  onSelect: (product: MockHourlyCheapestItem) => void;
  sortOrder: SortOrder;
  sortPercentOrder: SortOrder;
  onSortPrice: () => void;
  onSortPercent: () => void;
  deals: any[]; // TODO: типизировать deals
} 