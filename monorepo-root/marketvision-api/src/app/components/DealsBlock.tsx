import React from 'react';

import styles from '../styles/components/deals-block.module.scss';
import type { MockHourlyCheapestItem } from '../types/market';

interface DealsBlockProps {
  products: MockHourlyCheapestItem[];
}

const DealsBlock: React.FC<DealsBlockProps> = ({ products }) => (
  <div className={styles.deals}>
    <h3 className={styles.deals__title}>Выгодные предложения</h3>
    <p className={styles.deals__date}>на 12:00 12.января.2025</p>
    <ul className={styles.deals__list}>
      {products.map((item, idx) => (
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
  </div>
);

export default DealsBlock; 