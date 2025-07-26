import React from 'react';
import styles from '../styles/components/sidebar.module.scss';
import type { MockHourlyCheapestItem } from '../types/market';

interface SidebarProps {
  products: MockHourlyCheapestItem[];
  selected: MockHourlyCheapestItem;
  onSelect: (item: MockHourlyCheapestItem) => void;
  sortOrder: 'asc' | 'desc' | null;
  sortPercentOrder: 'asc' | 'desc' | null;
  onSortPrice: () => void;
  onSortPercent: () => void;
  deals: { id: number; title: string; price: number }[];
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

const Sidebar: React.FC<SidebarProps> = ({ products, selected, onSelect, sortOrder, sortPercentOrder, onSortPrice, onSortPercent, deals }) => (
  <aside className={styles.sidebar}>
    <div className={styles.sidebar__main}>
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
        {products.map((t) => {
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
    </div>
    <div className={styles.sidebar__dealsblock}>
      <div className={styles.sidebar__dealstitle}>Выгодные предложения</div>
      <div className={styles.sidebar__dealsdate}>на 12.01.2025</div>
      <ul className={styles.sidebar__dealslist}>
        {deals.map((deal) => (
          <li key={deal.id} className={styles.sidebar__dealitem}>
            <span className={styles.sidebar__dealtitle}>{deal.title}</span>
            <span className={styles.sidebar__dealprice}>{deal.price.toLocaleString('ru-RU')}₽</span>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

export default Sidebar; 