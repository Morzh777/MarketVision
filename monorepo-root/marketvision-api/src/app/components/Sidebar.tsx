import Image from 'next/image';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import type { PopularQuery } from '../types/market';
import { createSearchVariants } from '../utils/transliteration';
import { RUBLE } from '../utils/currency';

import '../styles/components/sidebar.scss';

interface SidebarProps {
  popularQueries: PopularQuery[];
  selectedQuery: string;
  onSelectQuery: (query: string) => void;
  sortOrder: 'asc' | 'desc' | null;
  sortPercentOrder: 'asc' | 'desc' | null;
  onSortPrice: () => void;
  onSortPercent: () => void;
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
  onSortPercent
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);



  // Фильтрация продуктов по поисковому запросу с транслитерацией
  const filteredQueries = useMemo(() => {
    if (!searchQuery.trim()) return popularQueries;
    
    const searchVariants = createSearchVariants(searchQuery);
    
    return popularQueries.filter((query: PopularQuery) => {
      const queryText = query.query.toLowerCase();
      
      return searchVariants.some(variant => 
        queryText.includes(variant)
      );
    });
  }, [popularQueries, searchQuery]);

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
        <span className="sidebar__title">Популярные запросы</span>
        <button
          type="button"
          onClick={onSortPrice}
          className={
            'sidebar__sort-btn' + (sortOrder ? ' sidebar__sort-btn--active' : '')
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
            'sidebar__sort-btn' + (sortPercentOrder ? ' sidebar__sort-btn--active' : '')
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