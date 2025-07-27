import { useState, useMemo, useCallback } from 'react';

interface PopularQuery {
  query: string;
  minPrice: number;
  id: string;
  priceChangePercent: number;
}

type SortOrder = 'asc' | 'desc' | null;

export const useQuerySorting = (queries: PopularQuery[]) => {
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

  const sortedQueries = useMemo(() => {
    const sorted = [...queries];
    
    if (sortOrder) {
      sorted.sort((a, b) =>
        sortOrder === 'asc' ? a.minPrice - b.minPrice : b.minPrice - a.minPrice
      );
    } else if (sortPercentOrder) {
      sorted.sort((a, b) =>
        sortPercentOrder === 'asc' 
          ? a.priceChangePercent - b.priceChangePercent 
          : b.priceChangePercent - a.priceChangePercent
      );
    }
    
    return sorted;
  }, [queries, sortOrder, sortPercentOrder]);

  return {
    sortedQueries,
    sortOrder,
    sortPercentOrder,
    handleSortPriceClick,
    handleSortPercentClick,
  };
}; 