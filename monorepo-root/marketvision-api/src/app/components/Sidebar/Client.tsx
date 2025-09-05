"use client";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { PopularQuery } from '../../types/market';
import { RUBLE, formatPrice } from '../../utils/currency';
import { createSearchVariants } from '../../utils/transliteration';
import { SortAscIcon, SortDescIcon } from '../Icons';
import LoadingSpinner from '../LoadingSpinner';
import SearchBar from '../SearchBar';

interface Props {
  popularQueries: PopularQuery[];
  favoriteQueries: PopularQuery[];
  initialFilter?: string;
  initialCategory?: string;
}

// Простой компонент без мемоизации для максимальной производительности
const SidebarItem = ({ query, onSelect, isSelected }: { query: PopularQuery; onSelect: (query: string) => void; isSelected: boolean }) => (
  <li className={`sidebar__item ${isSelected ? 'sidebar__item--active' : ''}`} onClick={() => onSelect(query.query)}>
    <div className="sidebar__item-avatar">
      {query.image_url ? (
        <Image src={query.image_url} alt={query.query} width={32} height={32} className="sidebar__item-avatar-img" />
      ) : (
        <div className="sidebar__item-avatar-inner">{query.query.charAt(0).toUpperCase()}</div>
      )}
    </div>
    <div className="sidebar__item-content">
      <span className="sidebar__item-name">{query.query}</span>
    </div>
    <span className="sidebar__item-price">{formatPrice(query.minPrice)} {RUBLE}</span>
    <span className={`sidebar__item-percent ${query.priceChangePercent <= 0 ? 'sidebar__item-percent--green' : 'sidebar__item-percent--red'}`}>
      {query.priceChangePercent > 0 ? '+' : ''}{query.priceChangePercent.toFixed(1)}%
    </span>
  </li>
);

export default function Client({ popularQueries, favoriteQueries, initialFilter, initialCategory }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [sortPercentOrder, setSortPercentOrder] = useState<'asc' | 'desc' | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(initialFilter === 'favorites');
  const [isNavigating] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState('');

  // Отслеживаем скролл для показа скроллбара
  useEffect(() => {
    const listElement = document.querySelector('.sidebar__list');
    if (!listElement) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      listElement.classList.add('scrolling');
      
      // Скрываем скроллбар через 1 секунду после остановки скролла
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        listElement.classList.remove('scrolling');
      }, 1000);
    };

    listElement.addEventListener('scroll', handleScroll);
    
    return () => {
      listElement.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Убираем лишние useEffect'ы для производительности
  // useEffect(() => {
  //   const currentFilter = searchParams.get('filter');
  //   if (currentFilter === 'favorites' && !showFavoritesOnly) {
  //     router.refresh();
  //   }
  // }, [searchParams, showFavoritesOnly, router]);

  // useEffect(() => {
  //   setIsNavigating(false);
  // }, [searchParams]);

  // useEffect(() => {
  //   if (showFavoritesOnly) {
  //     router.refresh();
  //   }
  // }, [showFavoritesOnly, router]);

  useEffect(() => {
    const savedSearch = sessionStorage.getItem('sidebarSearchQuery');
    const savedCategory = sessionStorage.getItem('sidebarSelectedCategory');
    const savedShowFavoritesOnly = sessionStorage.getItem('sidebarShowFavoritesOnly');
    
    if (savedSearch) setSearchQuery(savedSearch);
    if (savedCategory) setSelectedCategory(savedCategory);
    if (savedShowFavoritesOnly === 'true') setShowFavoritesOnly(true);
  }, []);

  // Устанавливаем начальное состояние фильтра избранного
  useEffect(() => {
    if (initialFilter === 'favorites') {
      setShowFavoritesOnly(true);
      setSelectedCategory('all');
    }
  }, [initialFilter]);

  // Убираем лишние sessionStorage операции для производительности
  // useEffect(() => {
  //   sessionStorage.setItem('sidebarSearchQuery', searchQuery);
  // }, [searchQuery]);

  // useEffect(() => {
  //   sessionStorage.setItem('sidebarShowFavoritesOnly', showFavoritesOnly.toString());
  // }, [showFavoritesOnly]);


  useEffect(() => {
    if (!isCategoryOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsCategoryOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isCategoryOpen]);

  const categories: string[] = useMemo(() => {
    const set = new Set<string>();
    popularQueries.forEach((q) => {
      const c = (q as unknown as { category?: string }).category;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [popularQueries]);

  const filteredQueries = useMemo(() => {
    // Выбираем источник данных: все запросы или только избранные
    const sourceQueries = showFavoritesOnly ? favoriteQueries : popularQueries;
    let list = sourceQueries;
    
    // Фильтр по категории (только если не выбрано "Избранное")
    if (!showFavoritesOnly && selectedCategory !== 'all') {
      list = list.filter((q: PopularQuery) => (q as unknown as { category?: string }).category === selectedCategory);
    }

    // Фильтр по поиску
    if (searchQuery.trim()) {
      const searchVariants = createSearchVariants(searchQuery);
      list = list.filter((q: PopularQuery) =>
        searchVariants.some((v) => q.query.toLowerCase().includes(v))
      );
    }
    
    // Сортировка
    if (sortOrder) {
      list = [...list].sort((a, b) => (sortOrder === 'asc' ? a.minPrice - b.minPrice : b.minPrice - a.minPrice));
    } else if (sortPercentOrder) {
      list = [...list].sort((a, b) =>
        sortPercentOrder === 'asc' ? a.priceChangePercent - b.priceChangePercent : b.priceChangePercent - a.priceChangePercent
      );
    }
    return list;
  }, [popularQueries, favoriteQueries, selectedCategory, searchQuery, sortOrder, sortPercentOrder, showFavoritesOnly]);

  const handleSelectQuery = useCallback((query: string) => {
    setSelectedQuery(query);
    const productUrl = `/product/${encodeURIComponent(query)}`;
    router.push(productUrl);
  }, [router]);

  const handleFavoritesClick = () => {
    setShowFavoritesOnly(true);
    setSelectedCategory('all');
    setIsCategoryOpen(false);
    // Сохраняем состояние в sessionStorage
    try {
      sessionStorage.setItem('sidebarShowFavoritesOnly', 'true');
      sessionStorage.setItem('sidebarSelectedCategory', 'all');
    } catch {}
    
    // Переходим на страницу избранного без telegram_id в URL
    router.push('/?filter=favorites');
  };

  return (
    <aside className="sidebar">
      {isNavigating && (
        <div className="sidebar__loading-overlay">
          <LoadingSpinner 
            message="Загрузка..." 
            size="medium" 
            variant="overlay" 
            isVisible={isNavigating} 
          />
        </div>
      )}
      <div className="sidebar__header">
        {/* Поиск */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="sidebar__controls">
          <button type="button" className="sidebar__filter-btn" onClick={() => setIsCategoryOpen(true)}>
            <span className="sidebar__filter-label">
              {showFavoritesOnly ? 'Избранное' : 
               selectedCategory === 'all' ? 'Все запросы' : selectedCategory}
            </span>
            <span className={`sidebar__filter-caret ${isCategoryOpen ? 'open' : ''}`}>▸</span>
          </button>
          
          {isCategoryOpen && (
            <div className="sidebar__filter-overlay" onClick={() => setIsCategoryOpen(false)}>
              <div className="sidebar__filter-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="sidebar__filter-drawer-header">
                  <span>Выберите категорию</span>
                  <button type="button" className="sidebar__filter-close" onClick={() => setIsCategoryOpen(false)}>
                    ✕
                  </button>
                </div>
                <div className="sidebar__filter-drawer-list">
                  <button
                    type="button"
                    className={`sidebar__filter-item ${selectedCategory === 'all' && !showFavoritesOnly ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory('all');
                      setShowFavoritesOnly(false);
                      setIsCategoryOpen(false);
                      // Сохраняем состояние в sessionStorage
                      try {
                        sessionStorage.setItem('sidebarSelectedCategory', 'all');
                        sessionStorage.setItem('sidebarShowFavoritesOnly', 'false');
                      } catch {}
                      
                      // Переходим на главную страницу
                      router.push('/');
                    }}
                  >
                    Все запросы
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`sidebar__filter-item ${selectedCategory === cat && !showFavoritesOnly ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowFavoritesOnly(false);
                        setIsCategoryOpen(false);
                        // Сохраняем состояние в sessionStorage
                        try {
                          sessionStorage.setItem('sidebarSelectedCategory', cat);
                          sessionStorage.setItem('sidebarShowFavoritesOnly', 'false');
                        } catch {}
                        
                        // Переходим на страницу категории
                        router.push(`/?category=${cat}`);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`sidebar__filter-item sidebar__filter-item--favorites ${showFavoritesOnly ? 'active' : ''}`}
                    onClick={handleFavoritesClick}
                  >
                    Избранное
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={useCallback(() => {
              if (sortPercentOrder) {
                setSortPercentOrder(null);
              }
              setSortOrder((p) => (p === 'asc' ? 'desc' : p === 'desc' ? null : 'asc'));
            }, [sortPercentOrder])}
            className={'sidebar__sort-btn sidebar__sort-btn--price' + (sortOrder ? ' sidebar__sort-btn--active' : '')}
          >
            Мин. цена
            {sortOrder === 'asc' && <SortAscIcon />}
            {sortOrder === 'desc' && <SortDescIcon />}
          </button>
          <button
            type="button"
            onClick={useCallback(() => {
              if (sortOrder) {
                setSortOrder(null);
              }
              setSortPercentOrder((p) => (p === 'asc' ? 'desc' : p === 'desc' ? null : 'asc'));
            }, [sortOrder])}
            className={'sidebar__sort-btn sidebar__sort-btn--percent' + (sortPercentOrder ? ' sidebar__sort-btn--active' : '')}
          >
            Изм. %
            {sortPercentOrder === 'asc' && <SortAscIcon />}
            {sortPercentOrder === 'desc' && <SortDescIcon />}
          </button>
        </div>
      </div>

      <ul className="sidebar__list">
        {filteredQueries.map((q: PopularQuery) => (
          <SidebarItem key={q.id} query={q} onSelect={handleSelectQuery} isSelected={selectedQuery === q.query} />
        ))}
      </ul>

      {filteredQueries.length === 0 && searchQuery && (
        <div className="sidebar__no-results">
          <p>По запросу &quot;{searchQuery}&quot; ничего не найдено</p>
        </div>
      )}
    </aside>
  );
}

