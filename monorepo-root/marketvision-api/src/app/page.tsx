"use client";
import React, { useState, useEffect } from "react";

import 'simplebar-react/dist/simplebar.min.css';
import ChartBlock from './components/ChartBlock';
import DealsBlock from './components/DealsBlock';
import Marquee from './components/Marquee';
import Sidebar from './components/Sidebar';
import styles from './styles/components/page.module.scss';
import { testProductsData, mockDeals, Timeframe, recommendedPrice2024 } from './testData';
import { priceHistoryMap } from './testPriceHistoryData';




export default function Home() {
  const [selected, setSelected] = useState(testProductsData[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [sortPercentOrder, setSortPercentOrder] = useState<'asc' | 'desc' | null>(null);

  const handleSortPriceClick = () => {
    setSortOrder((prev) => {
      const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (next) setSortPercentOrder(null); // сбросить сортировку по %
      return next;
    });
  };

  const handleSortPercentClick = () => {
    setSortPercentOrder((prev) => {
      const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (next) setSortOrder(null); // сбросить сортировку по цене
      return next;
    });
  };

  const sortedProducts = [...testProductsData];
  if (sortOrder) {
    sortedProducts.sort((a, b) =>
      sortOrder === 'asc' ? a.price - b.price : b.price - a.price
    );
  } else if (sortPercentOrder) {
    sortedProducts.sort((a, b) => {
      const percentA = a.recommended ? ((a.price - a.recommended) / a.recommended) * 100 : 0;
      const percentB = b.recommended ? ((b.price - b.recommended) / b.recommended) * 100 : 0;
      return sortPercentOrder === 'asc' ? percentA - percentB : percentB - percentA;
    });
  }

  // Получаем историю цен для выбранного товара и таймфрейма
  const priceHistory = priceHistoryMap[selected.qwerty ?? '']?.[timeframe] || [];
  const recommended = recommendedPrice2024[selected.qwerty ?? ''] || null;



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
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          priceHistory={priceHistory}
          recommended={recommended}
        />
        <DealsBlock products={testProductsData} />
      </div>
    </div>
  );
}
