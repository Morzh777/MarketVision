"use client";
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import type { PopularQuery } from '../../types/market';
import { RUBLE, formatPrice } from '../../utils/currency';
import { createSearchVariants } from '../../utils/transliteration';
import { SortAscIcon, SortDescIcon } from '../Icons';
import SearchBar from '../SearchBar';

interface Props {
  popularQueries: PopularQuery[];
  favoriteQueries: PopularQuery[];
  initialFilter?: string;
  initialCategory?: string;
  telegram_id?: string;
}

export default function Client({ popularQueries, favoriteQueries, initialFilter, initialCategory, telegram_id }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedQuery, setSelectedQuery] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [sortPercentOrder, setSortPercentOrder] = useState<'asc' | 'desc' | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(initialFilter === 'favorites');

  // Мониторим изменения URL для обновления данных
  useEffect(() => {
    const currentFilter = searchParams.get('filter');
    if (currentFilter === 'favorites' && !showFavoritesOnly) {
      // Если вернулись на страницу с фильтром favorites, обновляем страницу
      router.refresh();
    }
  }, [searchParams, showFavoritesOnly, router]);

  // Обновляем страницу при изменении фильтра избранного
  useEffect(() => {
    if (showFavoritesOnly) {
      // При включении фильтра избранного обновляем страницу для получения свежих данных
      router.refresh();
    }
  }, [showFavoritesOnly, router]);

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

  useEffect(() => {
    sessionStorage.setItem('sidebarSearchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('sidebarShowFavoritesOnly', showFavoritesOnly.toString());
  }, [showFavoritesOnly]);


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

  const handleSelectQuery = (query: string) => {
    try {
      sessionStorage.setItem('sidebarSelectedCategory', selectedCategory);
      sessionStorage.setItem('sidebarSearchQuery', searchQuery);
    } catch {}
    setSelectedQuery(query);
    
    // Используем telegram_id из props (приоритет) или из localStorage/cookies
    let telegramId: string | undefined = telegram_id;
    if (!telegramId && typeof window !== 'undefined') {
      // Сначала пробуем из localStorage
      telegramId = localStorage.getItem('telegram_id') || undefined;
      
      // Если нет в localStorage, пробуем из cookies
      if (!telegramId) {
        telegramId = document.cookie.split('; ').find(row => row.startsWith('telegram_id_client='))?.split('=')[1];
      }
      
      // Если нет в cookies, пробуем из URL параметров (если мы на главной)
      if (!telegramId && window.location.pathname === '/') {
        const urlParams = new URLSearchParams(window.location.search);
        telegramId = urlParams.get('telegram_id') || undefined;
      }
    }
    
    console.log('🔍 Sidebar: Переход на ProductPage с telegram_id:', telegramId, {
      fromProps: telegram_id,
      fromLocalStorage: typeof window !== 'undefined' ? localStorage.getItem('telegram_id') : null,
      fromCookies: typeof window !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('telegram_id_client='))?.split('=')[1] : null,
      fromUrl: typeof window !== 'undefined' && window.location.pathname === '/' ? new URLSearchParams(window.location.search).get('telegram_id') : null
    });
    
    const productUrl = telegramId ? 
      `/product/${encodeURIComponent(query)}?telegram_id=${telegramId}` : 
      `/product/${encodeURIComponent(query)}`;
    
    console.log('🔍 Sidebar: URL для перехода:', productUrl);
    router.push(productUrl);
  };

  const handleFavoritesClick = () => {
    setShowFavoritesOnly(true);
    setSelectedCategory('all');
    setIsCategoryOpen(false);
    // Сохраняем состояние в sessionStorage
    try {
      sessionStorage.setItem('sidebarShowFavoritesOnly', 'true');
      sessionStorage.setItem('sidebarSelectedCategory', 'all');
    } catch {}
    
    // Принудительно обновляем страницу для получения свежих данных избранного
    // Передаем telegram_id в URL
    if (telegram_id) {
      router.push(`/?filter=favorites&telegram_id=${telegram_id}`);
    } else {
      router.refresh();
    }
  };

  return (
    <aside className="sidebar">
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
                      
                      // Передаем telegram_id в URL при смене категории
                      if (telegram_id) {
                        router.push(`/?telegram_id=${telegram_id}`);
                      }
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
                        
                        // Передаем telegram_id в URL при смене категории
                        if (telegram_id) {
                          router.push(`/?category=${cat}&telegram_id=${telegram_id}`);
                        }
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
            onClick={() => {
              if (sortPercentOrder) {
                setSortPercentOrder(null);
              }
              setSortOrder((p) => (p === 'asc' ? 'desc' : p === 'desc' ? null : 'asc'));
            }}
            className={'sidebar__sort-btn sidebar__sort-btn--price' + (sortOrder ? ' sidebar__sort-btn--active' : '')}
          >
            Мин. цена
            {sortOrder === 'asc' && <SortAscIcon />}
            {sortOrder === 'desc' && <SortDescIcon />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (sortOrder) {
                setSortOrder(null);
              }
              setSortPercentOrder((p) => (p === 'asc' ? 'desc' : p === 'desc' ? null : 'asc'));
            }}
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
          <li
            key={q.id}
            className={'sidebar__item' + (selectedQuery === q.query ? ' sidebar__item--active' : '')}
            onClick={() => handleSelectQuery(q.query)}
          >
            <div className="sidebar__item-avatar">
              {q.image_url ? (
                <Image src={q.image_url} alt={q.query} width={32} height={32} className="sidebar__item-avatar-img" />
              ) : (
                <div className="sidebar__item-avatar-inner">{q.query.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="sidebar__item-content">
              <span className="sidebar__item-name">{q.query}</span>
            </div>
            <span className="sidebar__item-price">{`${formatPrice(q.minPrice)} ${RUBLE}`}</span>
            <span className={`sidebar__item-percent ${q.priceChangePercent <= 0 ? 'sidebar__item-percent--green' : 'sidebar__item-percent--red'}`}>
              {q.priceChangePercent > 0 ? '+' : ''}
              {q.priceChangePercent.toFixed(1)}%
            </span>
          </li>
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

