import { Product } from './parser.interfaces';

export interface WildberriesApiClient {
  searchProducts(query: string, xsubject: number): Promise<Product[]>;
}

export interface PhotoService {
  getProductPhoto(product: Product, category: string): Promise<string | null>;
} 