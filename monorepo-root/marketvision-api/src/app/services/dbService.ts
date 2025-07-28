import { credentials } from '@grpc/grpc-js';


import { RawProductServiceClient } from '../../../generated/proto/raw_product_grpc_pb';
import { GetRawProductsRequest, RawProduct, MarketStats } from '../../../generated/proto/raw_product_pb';
import type { Product, PriceHistory, Timeframe } from '../types/market';

export class DbService {
  private static client: RawProductServiceClient;

  private static getClient() {
    if (!this.client) {
      this.client = new RawProductServiceClient(
        process.env.DB_API_URL || 'localhost:50051',
        credentials.createInsecure()
      );
    }
    return this.client;
  }

  private static transformProduct(rawProduct: RawProduct, marketStats?: MarketStats): Product {
    return {
      hour: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      name: rawProduct.getName(),
      price: rawProduct.getPrice(),
      image: rawProduct.getImageUrl(),
      link: rawProduct.getProductUrl(),
      source: rawProduct.getSource(),
      category: rawProduct.getCategory(),
      qwerty: rawProduct.getQuery(),
      min: marketStats?.getMin() || undefined,
      max: marketStats?.getMax() || undefined,
      mean: marketStats?.getMean() || undefined,
      median: marketStats?.getMedian() || undefined,
      iqr: marketStats?.getIqrList() ? [marketStats.getIqrList()[0], marketStats.getIqrList()[1]] : undefined
    };
  }

  static async getProducts(query: string = ''): Promise<Product[]> {
    const request = new GetRawProductsRequest();
    request.setQuery(query);

    try {
      const response = await new Promise((resolve, reject) => {
        this.getClient().getRawProducts(request, (error, response) => {
          if (error) reject(error);
          else resolve(response);
        });
      });

      if (!response) {
        throw new Error('No response from DB API');
      }

      const products = response.getProductsList();
      const marketStats = response.getMarketStats();

      return products.map(product => this.transformProduct(product, marketStats));
    } catch (error) {
      console.error('Error fetching products from DB:', error);
      return [];
    }
  }

  static async getPriceHistory(productId: string, timeframe: Timeframe): Promise<PriceHistory> {
    // TODO: Implement price history fetching from DB
    // For now, return empty array as we need to implement this endpoint in db-api
    return [];
  }
} 