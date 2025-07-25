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

const ArrowUp = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sidebar__sorticon}><path d="M6 3L3 7H9L6 3Z" fill="currentColor"/></svg>
);
const ArrowDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sidebar__sorticon}><path d="M6 9L9 5H3L6 9Z" fill="currentColor"/></svg>
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
          {sortOrder === 'asc' && <ArrowUp />}
          {sortOrder === 'desc' && <ArrowDown />}
        </button>
        <button
          type="button"
          onClick={onSortPercent}
          className={
            styles.sidebar__sortbtn + (sortPercentOrder ? ' ' + styles['sidebar__sortbtn--active'] : '')
          }
        >
          <span className={styles.sidebar__sortbtntext}>Изм. %</span>
          {sortPercentOrder === 'asc' && <ArrowUp />}
          {sortPercentOrder === 'desc' && <ArrowDown />}
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