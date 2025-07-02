export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface ProductData {
  name: string;
  query: string;
  category: string;
  source: string;
  price: number;
}

export abstract class BaseValidator {
  abstract validate(query: string, productName: string): ValidationResult;
  abstract extractModel(text: string): string | null;
  
  protected normalizeText(text: string): string {
    return text.toUpperCase().trim();
  }
  
  protected simpleMatch(query: string, productName: string): boolean {
    const queryUpper = this.normalizeText(query);
    const productUpper = this.normalizeText(productName);
    return productUpper.includes(queryUpper);
  }
  
  protected modelMatch(query: string, productName: string): boolean {
    const queryModel = this.extractModel(query);
    if (!queryModel) return false;
    
    const productModel = this.extractModel(productName);
    if (!productModel) return false;
    
    return queryModel === productModel;
  }
} 