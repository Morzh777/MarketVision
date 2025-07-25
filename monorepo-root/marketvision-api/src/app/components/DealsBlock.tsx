import React, { useState, useEffect, useRef } from 'react';

import styles from '../styles/components/deals-block.module.scss';
import type { MockHourlyCheapestItem } from '../types/market';

interface DealsBlockProps {
  products: MockHourlyCheapestItem[];
}

const DealsBlock: React.FC<DealsBlockProps> = ({ products }) => {
  const [visibleItems, setVisibleItems] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const dealsRef = useRef<HTMLDivElement>(null);

  // Функция для загрузки дополнительных элементов
  const loadMoreItems = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setVisibleItems(prev => Math.min(prev + 5, products.length));
      setIsLoading(false);
    }, 300);
  };

  // Обработчик скролла
  useEffect(() => {
    const handleScroll = () => {
      if (!dealsRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = dealsRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      // Если прокрутили до 80% и есть еще элементы для загрузки
      if (scrollPercentage > 0.8 && visibleItems < products.length) {
        loadMoreItems();
      }
    };

    const dealsElement = dealsRef.current;
    if (dealsElement) {
      dealsElement.addEventListener('scroll', handleScroll);
      return () => dealsElement.removeEventListener('scroll', handleScroll);
    }
  }, [visibleItems, products.length, isLoading]);

  return (
    <div className={styles.deals} ref={dealsRef}>
      <h3 className={styles.deals__title}>Выгодные предложения</h3>
      <p className={styles.deals__date}>на 12:00 12.января.2025</p>
      <ul className={styles.deals__list}>
        {products.slice(0, visibleItems).map((item, idx) => (
          <li key={idx} className={styles.deals__item}>
            <div className={styles.deals__meta}>
              <span className={
                styles.deals__source + ' ' + (item.source === "wb" ? styles.deals__source_wb : '')
              }>{item.source === "wb" ? "WB" : "OZON"}</span>
              <span className={styles.deals__hour}>{item.hour}</span>
              {item.marketPriceNote && (
                <span className={styles.deals__note}>Ниже рынка</span>
              )}
            </div>
            <img src={item.image} alt={item.name} className={styles.deals__img} />
            <span className={styles.deals__name}>{item.name}</span>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={
                styles.deals__link + ' ' + (item.source === "wb" ? styles.deals__link_wb : styles.deals__link_ozon)
              }
            >
              {item.price.toLocaleString('ru-RU')} ₽
            </a>
          </li>
        ))}
      </ul>
      {isLoading && (
        <div className={styles.deals__loading}>
          Загрузка...
        </div>
      )}
    </div>
  );
};

export default DealsBlock; 