import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect } from 'react';

import type { PopularQuery } from '../types/market';
import { RUBLE } from '../utils/currency';
import { createSearchVariants } from '../utils/transliteration';

import '../styles/components/sidebar.scss';

interface SidebarProps {
  popularQueries: PopularQuery[];
  selectedQuery: string;
  onSelectQuery: (query: string) => void;
  sortOrder: 'asc' | 'desc' | null;
  sortPercentOrder: 'asc' | 'desc' | null;
  onSortPrice: () => void;
  onSortPercent: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const SortAscIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar__sorticon">
    <path d="M2 3H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 9H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SortDescIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar__sorticon">
    <path d="M2 3H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 9H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar__searchIcon">
    <path d="M11.5 11.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);



const Sidebar: React.FC<SidebarProps> = ({ 
  popularQueries, 
  selectedQuery, 
  onSelectQuery, 
  sortOrder, 
  sortPercentOrder, 
  onSortPrice, 
  onSortPercent,
  selectedCategory,
  onSelectCategory
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const handleOpenCategories = () => setIsCategoryOpen(true);
  const handleCloseCategories = () => setIsCategoryOpen(false);

  // Загружаем сохраненное состояние при монтировании
  useEffect(() => {
    const savedSearch = sessionStorage.getItem('sidebarSearchQuery');
    const savedCategory = sessionStorage.getItem('sidebarSelectedCategory');
    
    if (savedSearch) setSearchQuery(savedSearch);
    if (savedCategory && onSelectCategory) onSelectCategory(savedCategory);
  }, [onSelectCategory]);

  // Сохраняем состояние поиска при изменении
  useEffect(() => {
    sessionStorage.setItem('sidebarSearchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!isCategoryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isCategoryOpen]);



  // Фильтрация продуктов по поисковому запросу с транслитерацией
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
        : popularQueries.filter(
            (q) =>
              (q as unknown as { category?: string }).category ===
              selectedCategory,
          );

    if (!searchQuery.trim()) return byCategory;

    const searchVariants = createSearchVariants(searchQuery);
    return byCategory.filter((query: PopularQuery) => {
      const queryText = query.query.toLowerCase();
      return searchVariants.some((variant) => queryText.includes(variant));
    });
  }, [popularQueries, selectedCategory, searchQuery]);

  // При выборе запроса
  const handleSelectQuery = (query: string) => {
    onSelectQuery(query);
    // Переходим на страницу продукта
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
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="sidebar__search-clear"
            >
              ✕
            </button>
          )}
          <button 
            className={`sidebar__hamburger ${isSearchFocused ? 'sidebar__hamburger--hidden' : ''}`}
            aria-label="Открыть меню"
          >
            <span className="sidebar__hamburger-line"></span>
            <span className="sidebar__hamburger-line"></span>
            <span className="sidebar__hamburger-line"></span>
          </button>
        </div>
      </div>

      <div className="sidebar__header">
        <button
          type="button"
          className="sidebar__filter-btn"
          onClick={handleOpenCategories}
        >
          {selectedCategory === 'all' ? 'Все запросы' : selectedCategory}
          <span className={`sidebar__filter-caret ${isCategoryOpen ? 'open' : ''}`}>▸</span>
        </button>
        {/* Overlay + Drawer */}
        {isCategoryOpen && (
          <div className="sidebar__filter-overlay" onClick={handleCloseCategories}>
            <div className="sidebar__filter-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="sidebar__filter-drawer-header">
                <span>Выберите категорию</span>
                <button type="button" className="sidebar__filter-close" onClick={handleCloseCategories}>✕</button>
              </div>
              <div className="sidebar__filter-drawer-list">
                <button
                  type="button"
                  className={`sidebar__filter-item ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    onSelectCategory('all');
                    handleCloseCategories();
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
                      onSelectCategory(cat);
                      handleCloseCategories();
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
          onClick={onSortPrice}
          className={
            'sidebar__sort-btn sidebar__sort-btn--price' + (sortOrder ? ' sidebar__sort-btn--active' : '')
          }
        >
          Мин. цена
          {sortOrder === 'asc' && <SortAscIcon />}
          {sortOrder === 'desc' && <SortDescIcon />}
        </button>
        <button
          type="button"
          onClick={onSortPercent}
          className={
            'sidebar__sort-btn sidebar__sort-btn--percent' + (sortPercentOrder ? ' sidebar__sort-btn--active' : '')
          }
        >
          Изм. %
          {sortPercentOrder === 'asc' && <SortAscIcon />}
          {sortPercentOrder === 'desc' && <SortDescIcon />}
        </button>
      </div>

      <ul className="sidebar__list">
        {filteredQueries.map((q: PopularQuery) => {
          return (
            <li
              key={q.id}
              className={
                'sidebar__item' +
                (selectedQuery === q.query ? ' sidebar__item--active' : '')
              }
              onClick={() => handleSelectQuery(q.query)}
            >
              {/* Круглая картинка слева */}
              <div className="sidebar__item-avatar">
                {q.image_url ? (
                  <Image
                    src={q.image_url}
                    alt={q.query}
                    width={32}
                    height={32}
                    className="sidebar__item-avatar-img"
                  />
                ) : (
                  <div className="sidebar__item-avatar-inner">
                    {q.query.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Контент элемента */}
              <div className="sidebar__item-content">
                <span className="sidebar__item-name">{q.query}</span>
              </div>
              
              {/* Цена */}
                              <span className="sidebar__item-price">{q.minPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u200A')}{RUBLE}</span>
              
              {/* Процент изменения */}
              <span className={`sidebar__item-percent ${q.priceChangePercent <= 0 ? 'sidebar__item-percent--green' : 'sidebar__item-percent--red'}`}>
                {q.priceChangePercent > 0 ? '+' : ''}{q.priceChangePercent.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
      
      {filteredQueries.length === 0 && searchQuery && (
        <div className="sidebar__no-results">
          <p>По запросу &quot;{searchQuery}&quot; ничего не найдено</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 