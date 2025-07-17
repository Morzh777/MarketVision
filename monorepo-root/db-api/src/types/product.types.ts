export interface RawProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  imageUrl?: string;
  product_url?: string;
  productUrl?: string;
  category: string;
  source: string;
  query: string;
}

export interface ValidatedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  category: string;
  source: string;
  query: string;
  imageUrl?: string;
  productUrl?: string;
}

export interface ProductForService {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  category: string;
  source: string;
  query: string;
}

export interface MarketStats {
  productId: string;
  query: string;
  category: string;
  source: string;
  min: number;
  max: number;
  mean: number;
  median: number;
  iqr: number;
  totalCount: number;
  createdAt?: string | Date;
}

export interface BatchCreateRequest {
  products: RawProduct[];
  marketStats?: MarketStats;
}

export interface BatchCreateResponse {
  inserted: number;
  history: number;
}
