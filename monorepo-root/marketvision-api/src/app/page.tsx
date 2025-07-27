"use client";

import React, { useState, useEffect, Suspense } from "react";
import 'simplebar-react/dist/simplebar.min.css';

import ChartBlock from './components/ChartBlock';
import DealsBlock from './components/DealsBlock';
import { ErrorBoundary } from './components/ErrorBoundary';
import Marquee from './components/Marquee';
import Sidebar from './components/Sidebar';
import { useProductSorting } from './hooks/useProductSorting';
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
  const [selected, setSelected] = useState<Product>(ProductService.getProducts()[0]);
  const [chartTimeframe, setChartTimeframe] = useState<Timeframe>('day');
  const [historyTimeframe, setHistoryTimeframe] = useState<Timeframe>('day');
  
  const {
    sortedProducts,
    sortOrder,
    sortPercentOrder,
    handleSortPriceClick,
    handleSortPercentClick,
  } = useProductSorting(ProductService.getProducts());

  // Получаем историю цен для выбранного товара и таймфрейма графика
  const priceHistory = ProductService.getPriceHistory(selected.qwerty ?? '', chartTimeframe);
  const recommended = ProductService.getRecommendedPrice(selected.qwerty ?? '');

  // Получаем историю цен для компонента истории цен (независимо от графика)
  const historyPriceHistory = ProductService.getPriceHistory(selected.qwerty ?? '', historyTimeframe);

  // Следим за актуальностью выбранного товара
  useEffect(() => {
    if (!ProductService.findProductByName(selected.name)) {
      setSelected(ProductService.getProducts()[0]);
    }
  }, [selected.name]);

  return (
    <ErrorBoundary>
      <div className={styles.page}>
        <Marquee products={ProductService.getProducts()} />
        {/* Основная сетка */}
        <div className={styles.grid}>
          <Suspense fallback={<LoadingFallback />}>
            <Sidebar
              products={sortedProducts}
              selected={selected}
              onSelect={setSelected}
              sortOrder={sortOrder}
              sortPercentOrder={sortPercentOrder}
              onSortPrice={handleSortPriceClick}
              onSortPercent={handleSortPercentClick}
              deals={ProductService.getDeals()}
            />
          </Suspense>
          
          <Suspense fallback={<LoadingFallback />}>
            <ChartBlock
              selected={selected}
              timeframe={chartTimeframe}
              setTimeframe={setChartTimeframe}
              priceHistory={priceHistory}
              recommended={recommended}
              historyTimeframe={historyTimeframe}
              setHistoryTimeframe={setHistoryTimeframe}
              historyPriceHistory={historyPriceHistory}
            />
          </Suspense>
          
          <Suspense fallback={<LoadingFallback />}>
            <DealsBlock products={ProductService.getProducts()} />
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
}
