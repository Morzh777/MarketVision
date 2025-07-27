import Image from 'next/image';
import { useEffect, useRef } from 'react';

import styles from '../styles/components/deals-block.module.scss';
import type { Product } from '../types/market';

interface DealsBlockProps {
  products: Product[];
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
}

const DealsBlock: React.FC<DealsBlockProps> = ({ 
  products, 
  onLoadMore, 
  hasMore = false, 
  isLoading = false 
}) => {
  const dealsRef = useRef<HTMLDivElement>(null);

  // Обработчик скролла для загрузки дополнительных элементов
  useEffect(() => {
    const handleScroll = () => {
      if (!dealsRef.current || !onLoadMore || isLoading || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = dealsRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      // Если прокрутили до 80% и есть еще элементы для загрузки
      if (scrollPercentage > 0.8) {
        onLoadMore();
      }
    };

    const dealsElement = dealsRef.current;
    if (dealsElement) {
      dealsElement.addEventListener('scroll', handleScroll);
      return () => dealsElement.removeEventListener('scroll', handleScroll);
    }
  }, [onLoadMore, isLoading, hasMore]);

  return (
    <div className={styles.deals} ref={dealsRef}>
      <h3 className={styles.deals__title}>Выгодные предложения</h3>
      <ul className={styles.deals__list}>
        {products.map((item, idx) => (
          <li key={item.id || idx} className={styles.deals__item}>
            <div className={styles.deals__meta}>
              <span className={
                styles.deals__source + ' ' + (item.source === "wb" ? styles.deals__source_wb : '')
              }>{item.source === "wb" ? "WB" : "OZON"}</span>
              <span className={styles.deals__hour}>{item.created_at}</span>
              {item.marketPriceNote && (
                <span className={styles.deals__note}>Ниже рынка</span>
              )}
            </div>
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                className={styles.deals__img}
                width={300}
                height={140}
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                priority={false}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            ) : (
              <div className={styles.deals__imgPlaceholder}>
                Нет фото
              </div>
            )}
            <span className={styles.deals__name}>{item.name}</span>
            <a
              href={item.product_url}
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
      {!hasMore && products.length > 0 && (
        <div className={styles.deals__end}>
          Больше предложений нет
        </div>
      )}
    </div>
  );
};

export default DealsBlock; 