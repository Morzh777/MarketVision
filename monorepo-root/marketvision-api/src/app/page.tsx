"use client";

import React, { useState, useEffect } from "react";
import 'simplebar-react/dist/simplebar.min.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import { useQuerySorting } from './hooks/useQuerySorting';
import { ProductService } from './services/productService';
import styles from './styles/components/page.module.scss';
import type { Product } from './types/market';

const LoadingFallback = () => (
  <div className={styles.loading}>
    <div className={styles.loadingSpinner} />
    <p>Загрузка...</p>
  </div>
);

export default function Home() {
  const [popularQueries, setPopularQueries] = useState<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string }>>([]);
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { sortedQueries, sortOrder, sortPercentOrder, handleSortPriceClick, handleSortPercentClick } = useQuerySorting(popularQueries);

  // Загружаем популярные запросы при монтировании
  useEffect(() => {
    const fetchPopularQueries = async () => {
      setIsLoading(true);
      try {
        const queries = await ProductService.getPopularQueries();
        console.log('Fetched popular queries:', queries);
        
        // Изображения теперь приходят с сервера в getPopularQueries
        setPopularQueries(queries);
        // Убираем автоматический выбор первого запроса
      } catch (error) {
        console.error('Error fetching popular queries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularQueries();
  }, []);

  // Загружаем продукты по выбранному query только при явном выборе пользователя
  useEffect(() => {
    const fetchProductsByQuery = async () => {
      console.log('Page useEffect triggered:', { selectedQuery, hasQuery: !!selectedQuery });
      
      if (!selectedQuery) {
        console.log('Page: Clearing selected product - no query selected');
        setSelectedProduct(null);
        return;
      }
      
      try {
        console.log('Page: Fetching products for query:', selectedQuery);
        const { products, marketStats } = await ProductService.getProductsByQuery(selectedQuery);
        console.log('Fetched products by query:', { products, marketStats });
        
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
          console.log('Page: Setting selected product:', productWithStats);
          setSelectedProduct(productWithStats);
        }
      } catch (error) {
        console.error('Error fetching products by query:', error);
      }
    };

    fetchProductsByQuery();
  }, [selectedQuery]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <div className={styles.page}>
        <Sidebar
          popularQueries={sortedQueries}
          selectedQuery={selectedQuery}
          onSelectQuery={setSelectedQuery}
          sortOrder={sortOrder}
          sortPercentOrder={sortPercentOrder}
          onSortPrice={handleSortPriceClick}
          onSortPercent={handleSortPercentClick}
          selectedProduct={selectedProduct}
        />
      </div>
    </ErrorBoundary>
  );
}
