"use client";

import React, { useState, useEffect } from "react";

import 'simplebar-react/dist/simplebar.min.css';

import ChartBlock from './components/ChartBlock';
import DealsBlock from './components/DealsBlock';
import Marquee from './components/Marquee';
import Sidebar from './components/Sidebar';
import { useProductSorting } from './hooks/useProductSorting';
import styles from './styles/components/page.module.scss';
import { testProductsData, mockDeals, recommendedPrice2024 } from './testData';
import { priceHistoryMap } from './testPriceHistoryData';
import type { Timeframe } from './types/market';




export default function Home() {
  const [selected, setSelected] = useState(testProductsData[0]);
  const [chartTimeframe, setChartTimeframe] = useState<Timeframe>('day');
  const [historyTimeframe, setHistoryTimeframe] = useState<Timeframe>('day');
  
  const {
    sortedProducts,
    sortOrder,
    sortPercentOrder,
    handleSortPriceClick,
    handleSortPercentClick,
  } = useProductSorting(testProductsData);

  // Получаем историю цен для выбранного товара и таймфрейма графика
  const priceHistory = priceHistoryMap[selected.qwerty ?? '']?.[chartTimeframe] || [];
  const recommended = recommendedPrice2024[selected.qwerty ?? ''] || null;

  // Получаем историю цен для компонента истории цен (независимо от графика)
  const historyPriceHistory = priceHistoryMap[selected.qwerty ?? '']?.[historyTimeframe] || [];

  // Следим за актуальностью выбранного товара
  useEffect(() => {
    if (!testProductsData.find((item) => item.name === selected.name)) {
      setSelected(testProductsData[0]);
    }
  }, [testProductsData, selected]);

  return (
    <div className={styles.page}>
      <Marquee products={testProductsData} />
      {/* Основная сетка */}
      <div className={styles.grid}>
        <Sidebar
          products={sortedProducts}
          selected={selected}
          onSelect={setSelected}
          sortOrder={sortOrder}
          sortPercentOrder={sortPercentOrder}
          onSortPrice={handleSortPriceClick}
          onSortPercent={handleSortPercentClick}
          deals={mockDeals}
        />
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
        <DealsBlock products={testProductsData} />
      </div>
    </div>
  );
}
