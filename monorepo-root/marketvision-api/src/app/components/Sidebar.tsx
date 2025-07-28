import Image from 'next/image';
import React, { useState, useMemo, useEffect } from 'react';

import { ProductService } from '../services/productService';
import type { PopularQuery, Product } from '../types/market';
import { createSearchVariants } from '../utils/transliteration';

import ProductCard from './ProductCard';

import '../styles/components/sidebar.scss';

interface SidebarProps {
  popularQueries: PopularQuery[];
  selectedQuery: string;
  onSelectQuery: (query: string) => void;
  sortOrder: 'asc' | 'desc' | null;
  sortPercentOrder: 'asc' | 'desc' | null;
  onSortPrice: () => void;
  onSortPercent: () => void;
  selectedProduct?: Product | null;
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

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar__closeicon">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar__arrowlefticon">
    <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  selectedProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductCard, setShowProductCard] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ price: number | null; created_at: string }[]>([]);

  // Получаем историю цен для выбранного продукта
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (selectedProduct?.query) {
        console.log('Sidebar: Fetching price history for query:', {
          query: selectedProduct.query,
          name: selectedProduct.name,
          price: selectedProduct.price
        });
        try {
          // Запрашиваем последние 10 записей истории цен по query
          const historyData = await ProductService.getPriceHistoryByQuery(selectedProduct.query, 10);
          console.log('Sidebar: Received history data:', historyData);
          
          if (historyData.length > 0) {
            console.log('Sidebar: Setting price history:', historyData);
            setPriceHistory(historyData);
          } else {
            console.log('Sidebar: No data available');
            setPriceHistory([]);
          }
        } catch (error) {
          console.error('Error fetching price history:', error);
        }
      } else {
        console.log('Sidebar: No selectedProduct or no id');
      }
    };

    fetchPriceHistory();
  }, [selectedProduct]);

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
    // Показываем карточку сразу при клике
    setShowProductCard(true);
  };

  // Закрытие карточки товара
  const handleCloseProductCard = () => {
    setShowProductCard(false);
  };

  // Обработчики свайпа для закрытия карточки
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientX);
    setDragCurrent(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart !== null) {
      setDragCurrent(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (dragStart !== null && dragCurrent !== null) {
      const dragDistance = dragCurrent - dragStart;
      
      // Если свайп вправо больше 100px - закрываем карточку
      if (dragDistance > 100) {
        setShowProductCard(false);
      }
    }
    
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <>
      <aside className="sidebar">
        {/* Поиск */}
        <div className="sidebar__search">
          <div className="sidebar__search-container">
            <div className="sidebar__search-icon">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Поиск по запросам"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                <span className="sidebar__item-price">{q.minPrice.toLocaleString('ru-RU')}₽</span>
                
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

                        {/* Индикатор свайпа (как в Telegram) - УБРАН */}
                  {/* {showProductCard && (
                    <div className="sidebar__product-card-swipe-indicator" />
                  )} */}

                        {/* Карточка товара (выезжает справа) */}
                  {showProductCard && (
                    <div
                      className={`sidebar__product-card${showProductCard ? ' sidebar__product-card--visible' : ''}${dragStart !== null ? ' sidebar__product-card--dragging' : ''}`}
                      style={{
                        transform: dragStart !== null && dragCurrent !== null && dragCurrent > dragStart
                          ? `translateX(${dragCurrent - dragStart}px)`
                          : undefined
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className="sidebar__product-card-header">
                        <button
                          type="button"
                          className="sidebar__product-card-back"
                          onClick={handleCloseProductCard}
                        >
                          <ArrowLeftIcon />
                        </button>
                        <h3 className="sidebar__product-card-title">{selectedProduct?.query?.toUpperCase() || 'ПОИСКОВЫЙ ЗАПРОС'}</h3>
                        <button
                          type="button"
                          className="sidebar__product-card-close"
                          onClick={handleCloseProductCard}
                        >
                          <CloseIcon />
                        </button>
                      </div>

                      <div className="sidebar__product-card-content">
                        {selectedProduct ? (
                          <ProductCard 
                            product={selectedProduct} 
                            priceHistory={priceHistory} 
                          />
                        ) : (
                          <div className="sidebar__loading">
                            <p>Загрузка данных...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
    </>
  );
};

export default Sidebar; 