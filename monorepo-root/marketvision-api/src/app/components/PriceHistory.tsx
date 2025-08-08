import React, { useState, useRef, useEffect } from 'react';

import '../styles/components/price-history.scss';

interface PriceHistoryProps {
  priceHistory: Array<{ price: number | null; created_at: string }>;
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ priceHistory }) => {
  const [isClient, setIsClient] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Touch scroll handlers для мобильных устройств
  const handleTouchStart = () => {
    setIsScrolling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isScrolling && listRef.current) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsScrolling(false);
  };

  // Форматируем данные для отображения - берем последние 10 записей
  const formatPriceData = () => {
    // Берем последние 10 записей из истории
    const last10Records = priceHistory.slice(-10);
    
    return last10Records.map(item => {
      const date = new Date(item.created_at);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      
      // Формат: ДД.ММ.ГГГГ ЧЧ:ММ
      const label = `${day}.${month}.${year} ${hour}:${minute}`;
      
      return {
        label,
        price: item.price,
        date: item.created_at
      };
    });
  };

  const priceData = formatPriceData();

  if (!isClient) {
    return (
      <div className="priceHistory">
        <div className="priceHistory__header">
          <div className="priceHistory__titleRow">
            <h3 className="priceHistory__title">История цен</h3>
          </div>
        </div>
        <div className="priceHistory__list">
          <div className="priceHistory__item">
            <span className="priceHistory__date">Загрузка...</span>
            <span className="priceHistory__price">—</span>
          </div>
        </div>
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="priceHistory">
        <div className="priceHistory__header">
          <div className="priceHistory__titleRow">
            <h3 className="priceHistory__title">История цен</h3>
          </div>
        </div>
        <div className="priceHistory__empty">
          <p>Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="priceHistory">
      <div className="priceHistory__header">
        <div className="priceHistory__titleRow">
          <h3 className="priceHistory__title">История цен</h3>
        </div>
      </div>
      
      <div 
        className="priceHistory__list"
        ref={listRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {priceData.map((item, index) => (
          <div key={index} className="priceHistory__item">
            <span className="priceHistory__date">{item.label}</span>
            <span className={`priceHistory__price ${!item.price ? 'priceHistory__price_empty' : ''}`}>
              {item.price ? `${item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceHistory; 