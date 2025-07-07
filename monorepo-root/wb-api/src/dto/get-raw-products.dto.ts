export class GetRawProductsRequestDto {
  query!: string;
  category!: string;
  categoryKey?: string;
}

export class GetRawProductsResponseDto {
  products!: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string;
    product_url: string;
    category: string;
    source: string;
    query: string;
  }>;

  total_count!: number;
  source!: string;
} 