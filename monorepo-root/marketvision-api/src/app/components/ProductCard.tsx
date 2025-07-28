import Image from 'next/image';
import { useState } from 'react';



import CartIcon from './CartIcon';
import ImageModal from './ImageModal';
import PriceHistory from './PriceHistory';
import PriceTrendGraph from './PriceTrendGraph';

import '../styles/components/product-card.scss';

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
  priceHistory?: Array<{ price: number | null; created_at: string }>;

}

const ProductCard: React.FC<ProductCardProps> = ({ product, priceHistory = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);


  console.log('ProductCard product:', product);
  console.log('ProductCard priceHistory:', priceHistory);
  console.log('ProductCard priceHistory debug:', {
    length: priceHistory?.length,
    firstPrice: priceHistory?.[0]?.price,
    lastPrice: priceHistory?.[priceHistory.length - 1]?.price,
    firstDate: priceHistory?.[0]?.created_at,
    lastDate: priceHistory?.[priceHistory.length - 1]?.created_at
  });
  console.log('ProductCard market stats:', {
    min: product?.min,
    max: product?.max,
    mean: product?.mean
  });

  // Функция для определения тренда цен
  const getPriceTrend = (): 'up' | 'down' | 'stable' => {
    if (!priceHistory || priceHistory.length < 2) return 'stable';
    
    const validPrices = priceHistory
      .filter(item => item.price !== null && item.price !== undefined)
      .map(item => item.price as number);
    
    if (validPrices.length < 2) return 'stable';
    
    // Берем последние 2 точки для определения тренда
    const recentPrices = validPrices.slice(-2);
    const firstPrice = recentPrices[0];
    const lastPrice = recentPrices[recentPrices.length - 1];
    
    const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    console.log('Price trend debug:', {
      firstPrice,
      lastPrice,
      changePercent,
      validPrices: validPrices.slice(-5) // последние 5 цен для отладки
    });
    
    if (changePercent > 0.1) return 'up';      // Рост более 0.1%
    if (changePercent < -0.1) return 'down';   // Падение более 0.1%
    return 'stable';                           // Изменение менее 0.1%
  };

  if (!product) {
    return (
      <div className="productCard">
        <div className="productCard__empty">
          <p>Выберите товар для просмотра</p>
        </div>
      </div>
    );
  }

  return (
    <div className="productCard">
      <div className="productCard__main">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    className="productCard__image"
                    width={200}
                    height={200}
                    priority={false}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    onClick={() => setIsModalOpen(true)}
                    style={{ cursor: 'pointer' }}
                  />
        ) : (
          <div className="productCard__imagePlaceholder">
            Нет фото
          </div>
        )}
                <div className="productCard__infoBlock">
          {/* Описание товара под картинкой */}
          <div className="productCard__nameBlock">
            {product.product_url ? (
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="productCard__name"
              >
                {product.name}
              </a>
            ) : (
              <div className="productCard__name">{product.name}</div>
            )}
          </div>
          
          <div className="productCard__info">
            <div className="productCard__infoItem">
              <span className="productCard__infoLabel">Магазин:</span>
              <span className={`productCard__source productCard__source_${product.source}`}>
                {product.source?.toUpperCase() || '—'}
              </span>
            </div>
            
            <div className="productCard__infoItem">
              <span className="productCard__infoLabel">Категория:</span>
              <span className="productCard__infoValue">{product.category || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Отдельный блок с ценами */}
      <div className="productCard__pricesBlock">
        <div className="productCard__priceRow">
          <div className="productCard__priceWithIcon">
            <CartIcon className="productCard__priceIcon" size={20} />
            {product.product_url ? (
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`productCard__price productCard__price_link productCard__price_${product.source}`}
              >
                {Math.round(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')} ₽
              </a>
            ) : (
              <span className="productCard__price">
                {Math.round(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')} ₽
              </span>
            )}
          </div>
        </div>
        
        <div className="productCard__stats">
          {/* Тренд цен */}
          <div className="productCard__stat">
            <span className="productCard__statLabel">Тренд:</span>
            <div className="productCard__statValue">
              <PriceTrendGraph 
                className="productCard__trendIcon" 
                size={20} 
                trend={getPriceTrend()} 
              />
            </div>
          </div>
          
          {product.mean && (
                <div className="productCard__stat">
                  <span className="productCard__statLabel">Рыночная цена:</span>
                                          <span className="productCard__statValue productCard__statValue_market">
                          {product.price !== product.mean && (
                            <span className={`productCard__statDiff ${product.price < product.mean ? 'productCard__statDiff_positive' : 'productCard__statDiff_negative'}`}>
                              {product.price < product.mean ? '+' : '-'}
                              {Math.round(((Math.abs(product.mean - product.price)) / product.mean) * 100)}%
                            </span>
                          )}
                          {Math.round(product.mean).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')} ₽
                        </span>
                </div>
              )}
          {product.min && product.max && (
            <div className="productCard__stat">
              <span className="productCard__statLabel">Диапазон цен:</span>
              <span className="productCard__statValue">
                {Math.round(product.min).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')} - {Math.round(product.max).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')} ₽
              </span>
            </div>
          )}
        </div>
        
        {/* Кнопка перехода в магазин */}
        {product.product_url && (
          <div className="productCard__actionButtons">
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`productCard__shopButton productCard__shopButton_${product.source}`}
            >
              Перейти в магазин
            </a>
          </div>
        )}
      </div>

                  {/* Блок истории цен - ТОЛЬКО НА МОБИЛЬНЫХ */}
            <div className="productCard__priceHistory">
              <PriceHistory
                priceHistory={priceHistory}
              />
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