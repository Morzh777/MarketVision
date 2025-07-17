"use client";
import ReactECharts from 'echarts-for-react';
import React, { useState, useEffect } from "react";
import { FaRegCalendarAlt, FaRegCalendar, FaRegCalendarCheck, FaRegClock, FaSortAmountDownAlt, FaSortAmountUpAlt } from 'react-icons/fa';
import SimpleBar from 'simplebar-react';

import 'simplebar-react/dist/simplebar.min.css';
import ChartBlock from './components/ChartBlock';
import DealsBlock from './components/DealsBlock';
import Marquee from './components/Marquee';
import Sidebar from './components/Sidebar';
import { testProductsData, mockDeals, Timeframe, recommendedPrice2024 } from './testData';
import {
  priceHistoryMap,
  genPriceHistoryDay,
  genPriceHistoryWeek,
  genPriceHistoryMonth,
  genPriceHistoryYear,
  PriceHistoryProduct
} from './testPriceHistoryData';
import { getChartOption } from './utils/chartUtils';

// Тип для mockHourlyCheapest с дополнительным полем qwerty
interface MockHourlyCheapestItem {
  hour: string;
  name: string;
  price: number;
  image: string;
  link: string;
  source: string;
  marketPriceNote?: string;
  qwerty?: string;
  recommended?: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  iqr?: [number, number];
  category?: string;
}

// Удаляю все определения testProductsData, mockDeals, chartData, PriceStats, Timeframe, а также их типы и дублирующие данные.

const timeframes = [
  { key: 'day' as Timeframe, label: 'День', icon: <FaRegClock /> },
  { key: 'week' as Timeframe, label: 'Неделя', icon: <FaRegCalendarCheck /> },
  { key: 'month' as Timeframe, label: 'Месяц', icon: <FaRegCalendar /> },
  { key: 'year' as Timeframe, label: 'Год', icon: <FaRegCalendarAlt /> },
];

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

  // Формируем данные для графика
  // chartLabels всегда фиксированный массив 00:00-23:00 для day
  const chartLabels = timeframe === 'day'
    ? Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0') + ':00')
    : priceHistory.map(item =>
        timeframe === 'year'
          ? item.created_at.slice(0, 7)
          : item.created_at.slice(5, 10)
      );
  const currentPrices = priceHistory.map(item => item.price);
  // Гарантируем, что все линии обрываются ровно там, где заканчивается текущая цена
  const lastValidIndex = (() => {
    let idx = -1;
    for (let i = 0; i < currentPrices.length; i++) {
      if (currentPrices[i] != null) idx = i;
    }
    return idx;
  })();
  const recommendedPrices = currentPrices.map((_, i) => i <= lastValidIndex ? recommended : null);

  // Проверка валидности mean для рыночной цены
  const isValidMean =
    selected.mean !== undefined &&
    selected.mean !== null &&
    selected.min !== undefined &&
    selected.max !== undefined &&
    selected.mean >= selected.min * 0.5 &&
    selected.mean <= selected.max * 2;

  // Функция для построения массива рыночной цены в обратном порядке
  function buildReverseMarketPrices(length: number, lastValidIndex: number, value: number | null) {
    const arr = Array(length).fill(null);
    for (let i = 0; i <= lastValidIndex; i++) {
      arr[lastValidIndex - i] = value;
    }
    return arr;
  }

  // Генерируем историю рыночной цены по mean, аналогично текущей цене, с учётом таймфрейма
  const genMarketHistoryByTimeframe = {
    day: genPriceHistoryDay,
    week: genPriceHistoryWeek,
    month: genPriceHistoryMonth,
    year: genPriceHistoryYear,
  };
  const marketPriceHistory: PriceHistoryProduct[] = isValidMean
    ? genMarketHistoryByTimeframe[timeframe](
        selected.mean ?? 0,
        selected.qwerty ?? '',
        selected.source ?? '',
        selected.hour ?? '23:00'
      )
    : [];
  // Выровнять длину массива с priceHistory
  const alignedMarketPriceHistory = marketPriceHistory.slice(0, priceHistory.length);
  const marketPrices = alignedMarketPriceHistory.map((item, i) =>
    i <= lastValidIndex ? item.price : null
  );

  // Диапазон по всем линиям для оси Y: min всегда 0, max по всем линиям с отступом 5%
  const allPrices = [
    ...currentPrices,
    ...recommendedPrices,
    ...marketPrices
  ];

  // Вычисляем нижнюю границу оси Y (10% ниже минимальной цены)
  const minY = selected.min ? Math.max(0, Math.floor(selected.min * 0.9)) : 0;

  // Функция для смещения значений вверх на 10% от minY
  function shiftValue(val: number | null): number | null {
    if (val == null) return null;
    return (val - minY) * 0.9 + minY;
  }

  // Следим за актуальностью выбранного товара
  useEffect(() => {
    if (!testProductsData.find((item) => item.name === selected.name)) {
      setSelected(testProductsData[0]);
    }
  }, [testProductsData, selected]);

  // Вместо chartOption = { ... }
  const chartOption = getChartOption(
    selected,
    priceHistory,
    recommended,
    marketPrices as number[],
    timeframe
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181A20] flex flex-col transition-colors duration-300">
      <Marquee products={testProductsData} />
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Плавная прокрутка для SimpleBar */
        .custom-simplebar .simplebar-content-wrapper {
          scroll-behavior: smooth;
        }
      `}</style>
      {/* Основная сетка */}
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] lg:grid-cols-[360px_1fr_320px] h-screen">
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
          chartOption={chartOption}
        />
        <DealsBlock products={testProductsData} />
      </div>
      {/* Добавляю глобальные стили для автоскрытия скроллбара */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #23272F;
          border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        /* SimpleBar кастомизация: скроллбар только при наведении */
        .simplebar-scrollbar {
         
          border-radius: 8px;
          opacity: 1 !important;
          transition: none;
        }
        .simplebar-track {
          background: transparent !important;
        }
        .custom-simplebar .simplebar-scrollbar {
          opacity: 0 !important;
          transition: opacity 0.2s;
        }
        .custom-simplebar:hover .simplebar-scrollbar,
        .custom-simplebar.simplebar-dragging .simplebar-scrollbar,
        .custom-simplebar .simplebar-scrollbar.simplebar-visible {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
