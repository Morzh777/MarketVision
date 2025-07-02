export interface Product {
    id: number;
    name: string;
    brand: string;
    price: number;
    sizes: any[];
    totalQuantity?: number;
    feedbacks?: number;
    supplierRating?: number;
    supplier?: string;
    promoTextCard?: string;
    promoTextCat?: string;
    isNew?: boolean;
    pics?: number;
  }
  
  export interface SearchResult {
    query: string;
    product: Product;
    stableId: string;
    photoFound: boolean;
    photoUrl: string | null;
    previousPrice?: number;
    discount?: number;
  }
  
  export interface Stats {
    executionTime: number;
    totalProducts: number;
    foundPhotos: number;
    errorCount: number;
    photoSuccessRate: number;
    avgSpeed: number;
  } 