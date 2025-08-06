export interface MockHourlyCheapestItem {
  recommended: number | null;
  hour: string;
  name: string;
  price: number;
  image: string;
  link: string;
  source: string;
  marketPriceNote?: string;
  qwerty?: string;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  iqr?: [number, number];
  category?: string;
}

export type Timeframe = 'day' | 'week' | 'month' | 'year';

export interface Product {
  id: string;
  created_at: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  source: string;
  marketPriceNote?: string;
  query?: string;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  iqr?: [number, number];
  category?: string;
}

export interface PopularQuery {
  query: string;
  minPrice: number;
  id: string;
  priceChangePercent: number;
  image_url: string; // Картинка товара для аватара
}

export interface PriceHistoryItem {
  price: number | null;
  created_at: string;
}

export type PriceHistory = PriceHistoryItem[];

export interface Deal {
  id: number;
  title: string;
  price: number;
}

export interface PriceHistoryMap {
  [key: string]: {
    [K in Timeframe]: PriceHistory;
  };
}

export interface RecommendedPrices {
  [key: string]: number;
}

export type SortOrder = 'asc' | 'desc' | null;

export interface ProductCardProps {
  product: {
    name: string;
    price: number;
    image?: string;
    source?: string;
    url?: string;
    hour?: string;
    marketPriceNote?: string;
    min?: number;
    max?: number;
    mean?: number;
    category?: string;
    qwerty?: string;
  } | null;
}

export interface ChartBlockProps {
  selected: Product;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  priceHistory: PriceHistoryItem[];
  recommended: number | null;
  historyTimeframe: Timeframe;
  setHistoryTimeframe: (tf: Timeframe) => void;
  historyPriceHistory: PriceHistoryItem[];
}

export interface SidebarProps {
  products: MockHourlyCheapestItem[];
  selected: MockHourlyCheapestItem;
  onSelect: (product: MockHourlyCheapestItem) => void;
  sortOrder: SortOrder;
  sortPercentOrder: SortOrder;
  onSortPrice: () => void;
  onSortPercent: () => void;
  deals: Deal[];
} 