"use client";

import React, { useState, useEffect, Suspense } from "react";
import 'simplebar-react/dist/simplebar.min.css';

import ChartBlock from './components/ChartBlock';
import DealsBlock from './components/DealsBlock';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import { useQuerySorting } from './hooks/useQuerySorting';
import { ProductService } from './services/productService';
import styles from './styles/components/page.module.scss';
import type { Product, Timeframe } from './types/market';

const LoadingFallback = () => (
  <div className={styles.loading}>
    <div className={styles.loadingSpinner} />
    <p>Загрузка...</p>
  </div>
);

export default function Home() {
  const [popularQueries, setPopularQueries] = useState<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number }>>([]);
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [productsByQuery, setProductsByQuery] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [historyTimeframe, setHistoryTimeframe] = useState<Timeframe>('month');
  const [priceHistory, setPriceHistory] = useState<{ price: number | null; created_at: string }[]>([]);
  const [historyPriceHistory, setHistoryPriceHistory] = useState<{ price: number | null; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Кэш для истории цен
  const [priceHistoryCache, setPriceHistoryCache] = useState<Record<string, { price: number | null; created_at: string }[]>>({});
  const { sortedQueries, sortOrder, sortPercentOrder, handleSortPriceClick, handleSortPercentClick } = useQuerySorting(popularQueries);

  // Загружаем популярные запросы при монтировании
  useEffect(() => {
    const fetchPopularQueries = async () => {
      setIsLoading(true);
      try {
        const queries = await ProductService.getPopularQueries();
        console.log('Fetched popular queries:', queries);
        setPopularQueries(queries);
        
        // Выбираем первый запрос по умолчанию
        if (queries.length > 0) {
          setSelectedQuery(queries[0].query);
        }
      } catch (error) {
        console.error('Error fetching popular queries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularQueries();
  }, []);

  // Загружаем продукты с пагинацией для правого блока
  useEffect(() => {
    const fetchProductsWithPagination = async () => {
      try {
        const { products, total, hasMore: hasMoreData } = await ProductService.getProductsWithPagination(1, 10);
        console.log('Fetched products with pagination:', { products, total, hasMore: hasMoreData });
        setAllProducts(products);
        setHasMore(hasMoreData);
      } catch (error) {
        console.error('Error fetching products with pagination:', error);
      }
    };

    fetchProductsWithPagination();
  }, []);

  // Функция для загрузки следующей страницы
  const loadMoreProducts = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const { products, hasMore: hasMoreData } = await ProductService.getProductsWithPagination(nextPage, 10);
      setAllProducts(prev => [...prev, ...products]);
      setCurrentPage(nextPage);
      setHasMore(hasMoreData);
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Загружаем продукты по выбранному query
  useEffect(() => {
    const fetchProductsByQuery = async () => {
      if (!selectedQuery) return;
      
      try {
        const { products, marketStats } = await ProductService.getProductsByQuery(selectedQuery);
        console.log('Fetched products by query:', { products, marketStats });
        setProductsByQuery(products);
        
        // Выбираем продукт с наиболее репрезентативной ценой
        if (products.length > 0) {
          // Сортируем продукты по цене и выбираем медианный
          const sortedProducts = [...products].sort((a, b) => a.price - b.price);
          const medianIndex = Math.floor(sortedProducts.length / 2);
          const selectedProductData = sortedProducts[medianIndex];
          
          const productWithStats = {
            ...selectedProductData,
            min: marketStats?.min,
            max: marketStats?.max,
            mean: marketStats?.mean,
            median: marketStats?.median,
            iqr: marketStats?.iqr
          };
          console.log('Setting selected product:', productWithStats);
          setSelectedProduct(productWithStats);
        }
      } catch (error) {
        console.error('Error fetching products by query:', error);
      }
    };

    fetchProductsByQuery();
  }, [selectedQuery]);

  // Загружаем историю цен для графика и блока истории с кэшированием
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (selectedProduct) {
        try {
          // Проверяем кэш для графика
          const graphCacheKey = `${selectedProduct.id}-${timeframe}`;
          if (priceHistoryCache[graphCacheKey]) {
            console.log(`[Cache] Using cached data for graph: ${graphCacheKey}`);
            setPriceHistory(priceHistoryCache[graphCacheKey]);
          } else {
            console.log(`[Cache] Fetching new data for graph: ${graphCacheKey}`);
          }

          // Проверяем кэш для блока истории
          const historyCacheKey = `${selectedProduct.id}-${historyTimeframe}`;
          if (priceHistoryCache[historyCacheKey]) {
            console.log(`[Cache] Using cached data for history: ${historyCacheKey}`);
            setHistoryPriceHistory(priceHistoryCache[historyCacheKey]);
          } else {
            console.log(`[Cache] Fetching new data for history: ${historyCacheKey}`);
          }

          // Определяем, какие timeframes нужно загрузить
          const timeframesToFetch: Timeframe[] = [];
          if (!priceHistoryCache[graphCacheKey]) {
            timeframesToFetch.push(timeframe);
          }
          if (!priceHistoryCache[historyCacheKey]) {
            timeframesToFetch.push(historyTimeframe);
          }

          // Загружаем только недостающие данные
          if (timeframesToFetch.length > 0) {
            const historyMulti = await ProductService.getPriceHistoryMulti(selectedProduct.id, timeframesToFetch);
            
            // Обновляем кэш и устанавливаем данные
            const newCache = { ...priceHistoryCache };
            
            if (historyMulti[timeframe]) {
              newCache[graphCacheKey] = historyMulti[timeframe];
              setPriceHistory(historyMulti[timeframe]);
            }
            
            if (historyMulti[historyTimeframe]) {
              newCache[historyCacheKey] = historyMulti[historyTimeframe];
              setHistoryPriceHistory(historyMulti[historyTimeframe]);
            }
            
            setPriceHistoryCache(newCache);
          }
        } catch (error) {
          console.error('Error fetching price history:', error);
        }
      }
    };

    fetchPriceHistory();
  }, [selectedProduct, timeframe, historyTimeframe, priceHistoryCache]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!selectedProduct) {
    return <div>Нет данных</div>;
  }

  return (
    <ErrorBoundary>
      <div className={styles.page}>

        {/* Основная сетка */}
        <div className={styles.grid}>
          <Suspense fallback={<LoadingFallback />}>
            <Sidebar
              popularQueries={sortedQueries}
              selectedQuery={selectedQuery}
              onSelectQuery={setSelectedQuery}
              sortOrder={sortOrder}
              sortPercentOrder={sortPercentOrder}
              onSortPrice={handleSortPriceClick}
              onSortPercent={handleSortPercentClick}
            />
          </Suspense>
          
          <Suspense fallback={<LoadingFallback />}>
            <ChartBlock
              selected={selectedProduct}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              priceHistory={priceHistory}
              recommended={null}
              historyTimeframe={historyTimeframe}
              setHistoryTimeframe={setHistoryTimeframe}
              historyPriceHistory={historyPriceHistory}
            />
          </Suspense>
          
                    <Suspense fallback={<LoadingFallback />}>
            <DealsBlock 
              products={allProducts} 
              onLoadMore={loadMoreProducts}
              hasMore={hasMore}
              isLoading={isLoadingMore}
            />
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
}
