import { useState, useEffect } from 'react';

import { ProductService } from '../services/productService';

interface PopularQueryWithChange extends PopularQuery {
  priceChangePercent: number;
}

interface PopularQuery {
  query: string;
  minPrice: number;
  id: string;
}

export const usePriceChange = (queries: PopularQuery[]) => {
  const [queriesWithChange, setQueriesWithChange] = useState<PopularQueryWithChange[]>([]);

  useEffect(() => {
    const calculatePriceChanges = async () => {
      const queriesWithChanges = await Promise.all(
        queries.map(async (query) => {
          try {
            // Получаем историю цен для этого query
            // Сначала получаем продукты по query, затем берем историю для первого продукта
            const { products } = await ProductService.getProductsByQuery(query.query);
            if (products.length === 0) {
              return {
                ...query,
                priceChangePercent: 0,
              };
            }
            
            const firstProduct = products[0];
            const history = await ProductService.getPriceHistory(firstProduct.id, 'month');
            
            let priceChangePercent = 0;
            
            if (history.length >= 2) {
              const currentPrice = history[history.length - 1].price;
              const previousPrice = history[history.length - 2].price;
              
              console.log(`[usePriceChange] ${query.query}: currentPrice=${currentPrice}, previousPrice=${previousPrice}`);
              
              if (currentPrice && previousPrice && previousPrice > 0) {
                priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
                console.log(`[usePriceChange] ${query.query}: calculated ${priceChangePercent}%`);
              }
            } else {
              console.log(`[usePriceChange] ${query.query}: found ${history.length} history records`);
            }
            
            return {
              ...query,
              priceChangePercent,
            };
          } catch (error) {
            console.error(`Error calculating price change for ${query.query}:`, error);
            return {
              ...query,
              priceChangePercent: 0,
            };
          }
        })
      );
      
      setQueriesWithChange(queriesWithChanges);
    };

    if (queries.length > 0) {
      calculatePriceChanges();
    }
  }, [queries]);

  return queriesWithChange;
}; 