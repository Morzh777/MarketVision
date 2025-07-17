import { useState } from 'react';

import type { MockHourlyCheapestItem, Timeframe } from '../types/market';

export function useSortedProducts(products: MockHourlyCheapestItem[], sortOrder: 'asc' | 'desc' | null, sortPercentOrder: 'asc' | 'desc' | null) {
  const sorted = [...products];
  if (sortOrder) {
    sorted.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
  } else if (sortPercentOrder) {
    sorted.sort((a, b) => {
      const percentA = a.recommended ? ((a.price - a.recommended) / a.recommended) * 100 : 0;
      const percentB = b.recommended ? ((b.price - b.recommended) / b.recommended) * 100 : 0;
      return sortPercentOrder === 'asc' ? percentA - percentB : percentB - percentA;
    });
  }
  return sorted;
}

export function useSelectedProduct(initial: MockHourlyCheapestItem) {
  const [selected, setSelected] = useState(initial);
  return [selected, setSelected] as const;
}

export function useTimeframe(initial: Timeframe) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initial);
  return [timeframe, setTimeframe] as const;
}

export function useSortHandlers(setSortOrder: any, setSortPercentOrder: any) {
  const handleSortPriceClick = () => {
    setSortOrder((prev: any) => {
      const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (next) setSortPercentOrder(null);
      return next;
    });
  };
  const handleSortPercentClick = () => {
    setSortPercentOrder((prev: any) => {
      const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (next) setSortOrder(null);
      return next;
    });
  };
  return { handleSortPriceClick, handleSortPercentClick };
} 