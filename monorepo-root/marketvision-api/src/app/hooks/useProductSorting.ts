import { useState, useMemo, useCallback } from 'react';
import type { MockHourlyCheapestItem, SortOrder } from '../types/market';

export const useProductSorting = (products: MockHourlyCheapestItem[]) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [sortPercentOrder, setSortPercentOrder] = useState<SortOrder>(null);

  const handleSortPriceClick = useCallback(() => {
    setSortOrder((prev) => {
      const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (next) setSortPercentOrder(null);
      return next;
    });
  }, []);

  const handleSortPercentClick = useCallback(() => {
    setSortPercentOrder((prev) => {
      const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';
      if (next) setSortOrder(null);
      return next;
    });
  }, []);

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    
    if (sortOrder) {
      sorted.sort((a, b) =>
        sortOrder === 'asc' ? a.price - b.price : b.price - a.price
      );
    } else if (sortPercentOrder) {
      sorted.sort((a, b) => {
        const percentA = a.recommended ? ((a.price - a.recommended) / a.recommended) * 100 : 0;
        const percentB = b.recommended ? ((b.price - b.recommended) / b.recommended) * 100 : 0;
        return sortPercentOrder === 'asc' ? percentA - percentB : percentB - percentA;
      });
    }
    
    return sorted;
  }, [products, sortOrder, sortPercentOrder]);

  return {
    sortedProducts,
    sortOrder,
    sortPercentOrder,
    handleSortPriceClick,
    handleSortPercentClick,
  };
}; 