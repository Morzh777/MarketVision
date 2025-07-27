import React, { useState, useRef, useEffect } from 'react';

import styles from '../styles/components/price-history.module.scss';
import type { Timeframe } from '../types/market';

interface PriceHistoryProps {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  priceHistory: Array<{ price: number | null; created_at: string }>;
}

const timeframes = [
  { key: 'day' as Timeframe, label: 'День' },
  { key: 'week' as Timeframe, label: 'Неделя' },
  { key: 'month' as Timeframe, label: 'Месяц' },
  { key: 'year' as Timeframe, label: 'Год' },
];

const PriceHistory: React.FC<PriceHistoryProps> = ({ timeframe, setTimeframe, priceHistory }) => {
  const [isClient, setIsClient] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Массив сокращенных названий месяцев
  const monthNames = [
    'янв.', 'фев.', 'мар.', 'апр.', 'май', 'июн.',
    'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'
  ];

  // Форматируем данные для отображения
  const formatPriceData = () => {
    if (timeframe === 'day') {
      // Находим последний час с ценой
      let lastHourWithPrice = -1;
      for (let h = 23; h >= 0; h--) {
        if (priceHistory[h]?.price !== null && priceHistory[h]?.price !== undefined) {
          lastHourWithPrice = h;
          break;
        }
      }
      
      // Если нет цен, возвращаем пустой массив
      if (lastHourWithPrice === -1) {
        return [];
      }
      
      // Создаем массив от последнего часа с ценой к 0 (новые цены сверху)
      return Array.from({ length: lastHourWithPrice + 1 }, (_, h) => {
        const hour = (lastHourWithPrice - h).toString().padStart(2, '0') + ':00';
        const price = priceHistory[lastHourWithPrice - h]?.price;
        return {
          label: hour,
          price: price,
          date: hour
        };
      });
    } else {
      return priceHistory.map(item => {
        let label = '';
        if (timeframe === 'year') {
          const month = item.created_at.slice(5, 7);
          const year = item.created_at.slice(0, 4);
          const monthIndex = parseInt(month) - 1;
          label = `${monthNames[monthIndex]} ${year}`;
        } else {
          const date = new Date(item.created_at);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          label = `${day}.${month}`;
        }
        return {
          label,
          price: item.price,
          date: item.created_at
        };
      });
    }
  };

  const priceData = formatPriceData();

  const handleTimeframeSelect = (selectedTimeframe: Timeframe) => {
    setTimeframe(selectedTimeframe);
    setIsDropdownOpen(false);
  };

  const currentTimeframeLabel = timeframes.find(tf => tf.key === timeframe)?.label || 'День';

  if (!isClient) {
    return (
      <div className={styles.priceHistory}>
        <div className={styles.priceHistory__header}>
          <div className={styles.priceHistory__titleRow}>
            <h3 className={styles.priceHistory__title}>История цен</h3>
            <div className={`${styles.priceHistory__dropdown} ${isDropdownOpen ? styles.open : ''}`} ref={dropdownRef}>
              <button
                className={styles.priceHistory__dropdownButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {currentTimeframeLabel}
                <span className={styles.priceHistory__dropdownArrow}>▼</span>
              </button>
              {isDropdownOpen && (
                <div className={styles.priceHistory__dropdownMenu}>
                  {timeframes.map((tf) => (
                    <button
                      key={tf.key}
                      onClick={() => handleTimeframeSelect(tf.key)}
                      className={`${styles.priceHistory__dropdownItem} ${
                        timeframe === tf.key ? styles['priceHistory__dropdownItem--active'] : ''
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.priceHistory__list}>
          <div className={styles.priceHistory__item}>
            <span className={styles.priceHistory__date}>Загрузка...</span>
            <span className={styles.priceHistory__price}>—</span>
          </div>
        </div>
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className={styles.priceHistory}>
        <div className={styles.priceHistory__header}>
          <div className={styles.priceHistory__titleRow}>
            <h3 className={styles.priceHistory__title}>История цен</h3>
            <div className={`${styles.priceHistory__dropdown} ${isDropdownOpen ? styles.open : ''}`} ref={dropdownRef}>
              <button
                className={styles.priceHistory__dropdownButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {currentTimeframeLabel}
                <span className={styles.priceHistory__dropdownArrow}>▼</span>
              </button>
              {isDropdownOpen && (
                <div className={styles.priceHistory__dropdownMenu}>
                  {timeframes.map((tf) => (
                    <button
                      key={tf.key}
                      onClick={() => handleTimeframeSelect(tf.key)}
                      className={`${styles.priceHistory__dropdownItem} ${
                        timeframe === tf.key ? styles['priceHistory__dropdownItem--active'] : ''
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.priceHistory__empty}>
          <p>Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.priceHistory}>
      <div className={styles.priceHistory__header}>
        <div className={styles.priceHistory__titleRow}>
          <h3 className={styles.priceHistory__title}>История цен</h3>
          <div className={`${styles.priceHistory__dropdown} ${isDropdownOpen ? styles.open : ''}`} ref={dropdownRef}>
            <button
              className={styles.priceHistory__dropdownButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {currentTimeframeLabel}
              <span className={styles.priceHistory__dropdownArrow}>▼</span>
            </button>
            {isDropdownOpen && (
              <div className={styles.priceHistory__dropdownMenu}>
                {timeframes.map((tf) => (
                  <button
                    key={tf.key}
                    onClick={() => handleTimeframeSelect(tf.key)}
                    className={`${styles.priceHistory__dropdownItem} ${
                      timeframe === tf.key ? styles['priceHistory__dropdownItem--active'] : ''
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.priceHistory__list} ref={listRef}>
        {priceData.map((item, index) => (
          <div key={index} className={styles.priceHistory__item}>
            <span className={styles.priceHistory__date}>{item.label}</span>
            <span className={`${styles.priceHistory__price} ${!item.price ? styles.priceHistory__price_empty : ''}`}>
              {item.price ? `${item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceHistory; 