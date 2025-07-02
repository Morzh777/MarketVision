import { WbApiClient } from '../api/wb-api.client';

export abstract class BaseService {
  constructor(protected wbApi: WbApiClient) {}

  protected mapApiResults(data: any[]): any[] {
    return data.map((product: any) => ({
      id: product.id,
      stableId: product.stableId,
      name: product.name,
      brand: product.brand || this.extractBrand(product.name),
      supplier: product.supplier || '',
      price: product.price,
      photoUrl: product.photoUrl || null,
      productUrl: product.productUrl, // 🔗 Готовая ссылка
      previousPrice: product.previousPrice || null,
      discount: product.discount || 0,
      query: product.query
    }));
  }

  // Простое извлечение бренда из названия
  private extractBrand(name: string): string {
    const brands = ['NVIDIA', 'AMD', 'Intel', 'MSI', 'ASUS', 'Gigabyte', 'EVGA', 'Sapphire', 'PowerColor', 'XFX'];
    const nameUpper = name.toUpperCase();
    
    for (const brand of brands) {
      if (nameUpper.includes(brand.toUpperCase())) {
        return brand;
      }
    }
    
    // Если не нашли известный бренд, берем первое слово
    return name.split(' ')[0] || '';
  }

  abstract getProducts(): Promise<any[]>;
} 