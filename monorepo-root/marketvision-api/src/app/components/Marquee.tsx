import React from 'react';
import styles from '../styles/components/marquee.module.scss';
import type { MockHourlyCheapestItem } from '../types/market';

interface MarqueeProps {
  products: MockHourlyCheapestItem[];
}

const Marquee: React.FC<MarqueeProps> = ({ products }) => (
  <div className={styles.marquee}>
    <div className={styles.marquee__fade}></div>
    <div className={styles.marquee__content}>
      {products.map((t, i) => {
        const percent = t.recommended ? ((t.price - t.recommended) / t.recommended) * 100 : 0.0;
        return (
          <span key={t.name + '-' + i} className={styles.marquee__item}>
            <span className={styles.marquee__name}>{t.name}</span>
            <span className={styles.marquee__price}>{t.price.toLocaleString('ru-RU')}₽</span>
            <span className={percent >= 0 ? styles.marquee__percent_green : styles.marquee__percent_red}>
              {percent > 0 ? "+" : ""}{percent.toFixed(1)}%
            </span>
          </span>
        );
      })}
      {products.map((t, i) => {
        const percent = t.recommended ? ((t.price - t.recommended) / t.recommended) * 100 : 0.0;
        return (
          <span key={t.name + '-dup-' + i} className={styles.marquee__item}>
            <span className={styles.marquee__name}>{t.name}</span>
            <span className={styles.marquee__price}>{t.price.toLocaleString('ru-RU')}₽</span>
            <span className={percent >= 0 ? styles.marquee__percent_green : styles.marquee__percent_red}>
              {percent > 0 ? "+" : ""}{percent.toFixed(1)}%
            </span>
          </span>
        );
      })}
    </div>
  </div>
);

export default Marquee; 