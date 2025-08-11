"use client";

import React, { useState, useEffect } from "react";
import 'simplebar-react/dist/simplebar.min.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import { useQuerySorting } from './hooks/useQuerySorting';
import { ProductService } from './services/productService';
import './styles/components/page.scss';

const LoadingFallback = () => (
  <div className="loading">
    <div className="loadingSpinner" />
    <p>Загрузка...</p>
  </div>
);

export default function Home() {
  const [popularQueries, setPopularQueries] = useState<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string }>>([]);
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Ранее использовалось для превью продукта на главной; сейчас не требуется
  const [isLoading, setIsLoading] = useState(true);
  
  const { sortedQueries, sortOrder, sortPercentOrder, handleSortPriceClick, handleSortPercentClick } = useQuerySorting(popularQueries);

  // Загружаем сохраненную категорию при монтировании
  useEffect(() => {
    const savedCategory = sessionStorage.getItem('sidebarSelectedCategory');
    if (savedCategory) setSelectedCategory(savedCategory);
  }, []);

  // Сохраняем выбранную категорию при изменении
  useEffect(() => {
    sessionStorage.setItem('sidebarSelectedCategory', selectedCategory);
  }, [selectedCategory]);

  // Загружаем популярные запросы при монтировании
  useEffect(() => {
    const fetchPopularQueries = async () => {
      setIsLoading(true);
      try {
        const queries = await ProductService.getPopularQueries();
        console.log('Fetched popular queries:', queries);
        
        // Изображения теперь приходят с сервера в getPopularQueries
        setPopularQueries(queries);
        // Кэшируем проценты изменения цены для использования на странице продукта
        try {
          const normalizeQuery = (s: string) => decodeURIComponent(s).toLowerCase().replace(/\s+/g, ' ').trim();
          const pctMap = Object.fromEntries(
            queries.map((q: { query: string; priceChangePercent: number }) => [normalizeQuery(q.query), q.priceChangePercent])
          );
          sessionStorage.setItem('popularQueryPctMap', JSON.stringify({ updatedAt: Date.now(), map: pctMap }));
        } catch {}
        // Убираем автоматический выбор первого запроса
      } catch (error) {
        console.error('Error fetching popular queries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularQueries();
  }, []);

  // Превью по выбранному запросу на главной не используем —
  // чтобы избежать лишних запросов при навигации в карточку

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <div className="page">
        <Sidebar
          popularQueries={sortedQueries}
          selectedQuery={selectedQuery}
          onSelectQuery={setSelectedQuery}
          sortOrder={sortOrder}
          sortPercentOrder={sortPercentOrder}
          onSortPrice={handleSortPriceClick}
          onSortPercent={handleSortPercentClick}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>
    </ErrorBoundary>
  );
}
