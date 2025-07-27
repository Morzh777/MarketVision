import React, { useState, useMemo } from 'react';

import styles from '../styles/components/sidebar.module.scss';
import { createSearchVariants } from '../utils/transliteration';

interface PopularQuery {
  query: string;
  minPrice: number;
  id: string;
  priceChangePercent: number;
}

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
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sidebar__sorticon}>
    <path d="M2 3H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 9H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SortDescIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sidebar__sorticon}>
    <path d="M2 3H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 9H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sidebar__searchIcon}>
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
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__main}>
        {/* Поиск */}
        <div className={styles.sidebar__search}>
          <div className={styles.sidebar__searchInput}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Поиск по запросам"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.sidebar__searchField}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.sidebar__searchClear}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className={styles.sidebar__header}>
          <span className={styles.sidebar__title}>Популярные запросы</span>
          <button
            type="button"
            onClick={onSortPrice}
            className={
              styles.sidebar__sortbtn + (sortOrder ? ' ' + styles['sidebar__sortbtn--active'] : '')
            }
          >
            <span className={styles.sidebar__sortbtntext}>Мин. цена</span>
            {sortOrder === 'asc' && <SortAscIcon />}
            {sortOrder === 'desc' && <SortDescIcon />}
          </button>
          <button
            type="button"
            onClick={onSortPercent}
            className={
              styles.sidebar__sortbtn + (sortPercentOrder ? ' ' + styles['sidebar__sortbtn--active'] : '')
            }
          >
            <span className={styles.sidebar__sortbtntext}>Изм. %</span>
            {sortPercentOrder === 'asc' && <SortAscIcon />}
            {sortPercentOrder === 'desc' && <SortDescIcon />}
          </button>
        </div>

        <ul className={styles.sidebar__list}>
          {filteredQueries.map((q: PopularQuery) => {
            return (
              <li
                key={q.id}
                className={
                  styles.sidebar__item +
                  (selectedQuery === q.query ? ' ' + styles['sidebar__item--active'] : '')
                }
                onClick={() => onSelectQuery(q.query)}
              >
                <span className={styles.sidebar__itemname}>{q.query}</span>
                <span className={styles.sidebar__itemprice}>{q.minPrice.toLocaleString('ru-RU')}₽</span>
                <span className={q.priceChangePercent <= 0 ? styles.sidebar__itempercent_green : styles.sidebar__itempercent_red}>
                  {q.priceChangePercent > 0 ? '+' : ''}{q.priceChangePercent.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
        
        {filteredQueries.length === 0 && searchQuery && (
          <div className={styles.sidebar__noResults}>
            <p>По запросу &quot;{searchQuery}&quot; ничего не найдено</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 