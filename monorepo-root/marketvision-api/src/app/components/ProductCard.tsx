import Image from 'next/image';
import { useState } from 'react';

import styles from '../styles/components/product-card.module.scss';

import ImageModal from './ImageModal';

interface ProductCardProps {
  product: {
    id?: string;
    name: string;
    price: number;
    image_url?: string;
    source?: string;
    product_url?: string;
    created_at?: string;
    marketPriceNote?: string;
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    iqr?: [number, number];
    category?: string;
    query?: string;
  } | null;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  console.log('ProductCard product:', product);
  console.log('ProductCard market stats:', { 
    min: product?.min, 
    max: product?.max, 
    mean: product?.mean
  });

  if (!product) {
    return (
      <div className={styles.productCard}>
        <div className={styles.productCard__empty}>
          <p>Выберите товар для просмотра</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productCard}>
      <div className={styles.productCard__main}>
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    className={styles.productCard__image}
                    width={180}
                    height={250}
                    priority={false}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    onClick={() => setIsModalOpen(true)}
                    style={{ cursor: 'pointer' }}
                  />
        ) : (
          <div className={styles.productCard__imagePlaceholder}>
            Нет фото
          </div>
        )}
        <div className={styles.productCard__infoBlock}>
          <div className={styles.productCard__content}>
            {product.product_url ? (
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.productCard__name}
              >
                {product.name}
              </a>
            ) : (
              <div className={styles.productCard__name}>{product.name}</div>
            )}
            
            <div className={styles.productCard__info}>
              <div className={styles.productCard__infoItem}>
                <span className={styles.productCard__infoLabel}>Магазин:</span>
                <span className={`${styles.productCard__source} ${styles[`productCard__source_${product.source}`]}`}>
                  {product.source?.toUpperCase() || '—'}
                </span>
              </div>
              
              <div className={styles.productCard__infoItem}>
                <span className={styles.productCard__infoLabel}>Категория:</span>
                <span className={styles.productCard__infoValue}>{product.category || '—'}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.productCard__prices}>
            <div className={styles.productCard__priceRow}>
              {product.product_url ? (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.productCard__price} ${styles.productCard__price_link} ${styles[`productCard__price_${product.source}`]}`}
                >
                  {Math.round(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽
                </a>
              ) : (
                <span className={styles.productCard__price}>
                  {Math.round(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽
                </span>
              )}
            </div>
            
            <div className={styles.productCard__stats}>

              {product.mean && (
                <div className={styles.productCard__stat}>
                  <span className={styles.productCard__statLabel}>Рыночная:</span>
                  <span className={`${styles.productCard__statValue} ${styles.productCard__statValue_market}`}>
                    {Math.round(product.mean).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽
                    {product.price < product.mean && (
                      <span className={styles.productCard__statDiff}>
                        -{Math.round(((product.mean - product.price) / product.mean) * 100)}%
                      </span>
                    )}
                  </span>
                </div>
              )}
              {product.min && product.max && (
                <div className={styles.productCard__stat}>
                  <span className={styles.productCard__statLabel}>Диапазон:</span>
                  <span className={styles.productCard__statValue}>
                    {Math.round(product.min).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} - {Math.round(product.max).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {product.image_url && (
        <ImageModal
          isOpen={isModalOpen}
          imageUrl={product.image_url}
          imageAlt={product.name}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductCard; 