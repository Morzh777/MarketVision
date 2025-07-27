import React, { useState, useMemo } from 'react';

import styles from '../styles/components/sidebar.module.scss';
import type { MockHourlyCheapestItem } from '../types/market';
import { createSearchVariants } from '../utils/transliteration';

interface SidebarProps {
  products: MockHourlyCheapestItem[];
  selected: MockHourlyCheapestItem;
  onSelect: (item: MockHourlyCheapestItem) => void;
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
  products, 
  selected, 
  onSelect, 
  sortOrder, 
  sortPercentOrder, 
  onSortPrice, 
  onSortPercent
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация продуктов по поисковому запросу с транслитерацией
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const searchVariants = createSearchVariants(searchQuery);
    
    return products.filter(product => {
      const productText = [
        product.qwerty?.toLowerCase() || '',
        product.name?.toLowerCase() || '',
        product.category?.toLowerCase() || ''
      ].join(' ');
      
      return searchVariants.some(variant => 
        productText.includes(variant)
      );
    });
  }, [products, searchQuery]);

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
          {filteredProducts.map((t) => {
            const percent = t.recommended ? ((t.price - t.recommended) / t.recommended) * 100 : 0.0;
            
            return (
              <li
                key={t.name}
                className={
                  styles.sidebar__item +
                  (selected.name === t.name ? ' ' + styles['sidebar__item--active'] : '')
                }
                onClick={() => onSelect(t)}
              >
                <span className={styles.sidebar__itemname}>{t.qwerty}</span>
                <span className={styles.sidebar__itemprice}>{t.price.toLocaleString('ru-RU')}₽</span>
                <span className={percent >= 0 ? styles.sidebar__itempercent_green : styles.sidebar__itempercent_red}>
                  {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
        
        {filteredProducts.length === 0 && searchQuery && (
          <div className={styles.sidebar__noResults}>
            <p>По запросу &quot;{searchQuery}&quot; ничего не найдено</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 