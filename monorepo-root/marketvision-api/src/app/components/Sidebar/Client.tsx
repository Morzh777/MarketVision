"use client";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import type { PopularQuery } from '../../types/market';
import { RUBLE, formatPrice } from '../../utils/currency';
import { createSearchVariants } from '../../utils/transliteration';
import { SearchIcon, SortAscIcon, SortDescIcon } from '../Icons';

interface Props {
  popularQueries: PopularQuery[];
}

export default function Client({ popularQueries }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [sortPercentOrder, setSortPercentOrder] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    const savedSearch = sessionStorage.getItem('sidebarSearchQuery');
    const savedCategory = sessionStorage.getItem('sidebarSelectedCategory');
    if (savedSearch) setSearchQuery(savedSearch);
    if (savedCategory) setSelectedCategory(savedCategory);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('sidebarSearchQuery', searchQuery);
  }, [searchQuery]);

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
    const byCategory =
      selectedCategory === 'all'
        ? popularQueries
        : popularQueries.filter((q) => (q as unknown as { category?: string }).category === selectedCategory);

    let list = byCategory;
    if (searchQuery.trim()) {
      const searchVariants = createSearchVariants(searchQuery);
      list = byCategory.filter((q: PopularQuery) =>
        searchVariants.some((v) => q.query.toLowerCase().includes(v))
      );
    }
    if (sortOrder) {
      list = [...list].sort((a, b) => (sortOrder === 'asc' ? a.minPrice - b.minPrice : b.minPrice - a.minPrice));
    } else if (sortPercentOrder) {
      list = [...list].sort((a, b) =>
        sortPercentOrder === 'asc' ? a.priceChangePercent - b.priceChangePercent : b.priceChangePercent - a.priceChangePercent
      );
    }
    return list;
  }, [popularQueries, selectedCategory, searchQuery, sortOrder, sortPercentOrder]);

  const handleSelectQuery = (query: string) => {
    try {
      sessionStorage.setItem('sidebarSelectedCategory', selectedCategory);
      sessionStorage.setItem('sidebarSearchQuery', searchQuery);
    } catch {}
    setSelectedQuery(query);
    router.push(`/product/${encodeURIComponent(query)}`);
  };

  return (
    <aside className="sidebar">
      {/* Поиск */}
      <div className="sidebar__search">
        <div className={`sidebar__search-container ${isSearchFocused ? 'sidebar__search-container--focused' : ''}`}>
          <div className="sidebar__search-icon">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Поиск по запросам"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="sidebar__search-input"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="sidebar__search-clear">
              ✕
            </button>
          )}
          <button className={`sidebar__hamburger ${isSearchFocused ? 'sidebar__hamburger--hidden' : ''}`} aria-label="Открыть меню">
            <span className="sidebar__hamburger-line"></span>
            <span className="sidebar__hamburger-line"></span>
            <span className="sidebar__hamburger-line"></span>
          </button>
        </div>
      </div>

      <div className="sidebar__header">
        <button type="button" className="sidebar__filter-btn" onClick={() => setIsCategoryOpen(true)}>
          {selectedCategory === 'all' ? 'Все запросы' : selectedCategory}
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
                  className={`sidebar__filter-item ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory('all');
                    setIsCategoryOpen(false);
                  }}
                >
                  Все запросы
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`sidebar__filter-item ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsCategoryOpen(false);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : p === 'desc' ? null : 'asc'))}
          className={'sidebar__sort-btn sidebar__sort-btn--price' + (sortOrder ? ' sidebar__sort-btn--active' : '')}
        >
          Мин. цена
          {sortOrder === 'asc' && <SortAscIcon />}
          {sortOrder === 'desc' && <SortDescIcon />}
        </button>
        <button
          type="button"
          onClick={() => setSortPercentOrder((p) => (p === 'asc' ? 'desc' : p === 'desc' ? null : 'asc'))}
          className={'sidebar__sort-btn sidebar__sort-btn--percent' + (sortPercentOrder ? ' sidebar__sort-btn--active' : '')}
        >
          Изм. %
          {sortPercentOrder === 'asc' && <SortAscIcon />}
          {sortPercentOrder === 'desc' && <SortDescIcon />}
        </button>
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

