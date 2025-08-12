import React, { useState, useRef, useEffect } from 'react';

import '../styles/components/price-history.scss';
import PriceTrendGraph from './PriceTrendGraph';
import { RUBLE, formatPrice } from '../utils/currency';

interface PriceHistoryProps {
  priceHistory: Array<{ price: number | null; created_at: string }>;
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ priceHistory }) => {
  const [isClient, setIsClient] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  // Устанавливаем isClient в true после монтирования компонента
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Обновляем состояние скролла, чтобы показывать/прятать градиенты
  const updateScrollState = () => {
    const el = listRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight + 1; // с запасом для субпикселей
    setCanScroll(scrollable);
    setAtTop(el.scrollTop <= 0);
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
  };

  const handleScroll = () => {
    updateScrollState();
  };

  // Форматируем данные для отображения - берем последние 5 записей (новые → старые)
  const formatPriceData = () => {
    // Сортируем по дате по убыванию и берем первые 5
    const sorted = [...priceHistory]
      .filter(i => i && i.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return sorted.map(item => {
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
  const trend = (() => {
    if (priceData.length < 2) return 'stable' as const;
    const first = priceData[priceData.length - 1].price ?? 0;
    const last = priceData[0].price ?? 0;
    if (last > first) return 'up' as const;
    if (last < first) return 'down' as const;
    return 'stable' as const;
  })();

  useEffect(() => {
    updateScrollState();
    const onResize = () => updateScrollState();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onResize);
      }
    };
  }, [priceHistory]);

  if (!isClient) {
    return (
      <div className="priceHistory">
        <div className="priceHistory__header">
          <div className="priceHistory__titleRow">
              <h3 className="priceHistory__title">История изменения цен</h3>
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
            <h3 className="priceHistory__title">История изменения цен</h3>
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
          <h3 className="priceHistory__title">История изменения цен</h3>
        </div>
      </div>
      

      <div
        className={`priceHistory__list ${canScroll ? 'is-scrollable' : ''} ${atTop ? 'at-top' : ''} ${atBottom ? 'at-bottom' : ''}`}
        ref={listRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {priceData.map((item, index) => (
          <div key={index} className="priceHistory__item">
            <span className="priceHistory__date">{item.label}</span>
            <span className={`priceHistory__price ${!item.price ? 'priceHistory__price_empty' : ''}`}>
              {item.price ? `${formatPrice(item.price)} ${RUBLE}` : '—'}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PriceHistory; 