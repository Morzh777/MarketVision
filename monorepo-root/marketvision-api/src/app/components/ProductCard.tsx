import Image from 'next/image';

import '../styles/components/product-card.scss';

import { RUBLE, formatPrice, formatPriceRange } from '../utils/currency';
import { decodeHtmlEntities } from '../utils/html';

import CartIcon from './CartIcon';
import { TrendUpChartIcon, TrendDownChartIcon } from './Icons';
import PriceHistory from './PriceHistory';
import PriceHistoryChart from './PriceHistoryChart';

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
  priceChangePercent?: number;
  onBack?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  priceHistory = [], 
  priceChangePercent
}) => {
  const getPriceTrend = (): 'up' | 'down' | 'stable' => {
    if (typeof priceChangePercent === 'number') {
      if (priceChangePercent > 0.1) return 'up';
      if (priceChangePercent < -0.1) return 'down';
      return 'stable';
    }

    if (!priceHistory || priceHistory.length < 2) return 'stable';
    
    const validPrices = priceHistory
      .filter(item => item.price !== null && item.price !== undefined)
      .map(item => item.price as number);
    
    if (validPrices.length < 2) return 'stable';
    
    const recentPrices = validPrices.slice(-2);
    const firstPrice = recentPrices[0];
    const lastPrice = recentPrices[1];
    
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  };



  const getPriceDifference = (): { percentage: number; isPositive: boolean } | null => {
    if (!product?.mean || product.price === product.mean) return null;
    
    const percentage = Math.round(((Math.abs(product.mean - product.price)) / product.mean) * 100);
    const isPositive = product.price < product.mean;
    
    return { percentage, isPositive };
  };

  if (!product) {
    return (
      <div className="productCard">
        <div className="productCard__empty">
          <div className="productCard__emptyIcon">📦</div>
          <p>Выберите товар для просмотра</p>
        </div>
      </div>
    );
  }

  const priceDiff = getPriceDifference();
  const trendPercent = typeof priceChangePercent === 'number' ? priceChangePercent : null;

  return (
    <div className="productCard">
      {/* Изображение товара */}
      <div className="productCard__imageSection">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            className="productCard__image"
            fill
            priority={false}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        ) : (
          <div className="productCard__imagePlaceholder">
            <div className="productCard__placeholderIcon">📷</div>
            <span>Нет фото</span>
          </div>
        )}

        {/* Кнопки поверх изображения убраны (перенесены в верхнюю панель) */}
        
          {/* Теги поверх изображения */}
        <div className="productCard__tags">
          {product.source && (
            <div className={`productCard__tag productCard__tag_source productCard__tag_${product.source}`}>
              {product.source.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Информация о товаре */}
      <div className="productCard__infoSection">
        {/* Название товара */}
          {product.product_url ? (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="productCard__name"
            >
              {decodeHtmlEntities(product.name)}
            </a>
          ) : (
            <h2 className="productCard__name">{decodeHtmlEntities(product.name)}</h2>
          )}

      </div>

      {/* Блок с ценами и статистикой */}
      <div className="productCard__pricingSection">
        {/* Блок с трендом и ценой  */}
        <div className="productCard__priceBlock">
          <span className="productCard__priceLabel">Текущая цена</span>
          <div className="productCard__priceRow">
            <div className="productCard__priceContent">
              <div className="productCard__priceLine">
                {(() => {
                  const trend = getPriceTrend();
                  if (trend === 'stable') return null;
                  const Icon = trend === 'up' ? TrendUpChartIcon : TrendDownChartIcon;
                  return <Icon className={`productCard__trendIcon trend-${trend}`} size={16} />;
                })()}
              {product.product_url ? (
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="productCard__price productCard__price_link"
                >
                  {formatPrice(product.price)} {RUBLE}
                </a>
              ) : (
                <span className="productCard__price">
                  {formatPrice(product.price)} {RUBLE}
                </span>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Статистика цен */}
        <div className="productCard__stats">
          {/* Рыночная цена */}
          {product.mean && (
            <div className="productCard__stat">
              <span className="productCard__statLabel">Рыночная цена</span>
              <div className="productCard__statValue">
                {trendPercent !== null ? (
                  <span className={`productCard__priceDiff ${trendPercent > 0 ? 'productCard__priceDiff_positive' : 'productCard__priceDiff_negative'}`}>
                    {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(1)}%
                  </span>
                ) : (
                  priceDiff && (
                    <span className={`productCard__priceDiff ${
                      priceDiff.isPositive ? 'productCard__priceDiff_positive' : 'productCard__priceDiff_negative'
                    }`}>
                      {priceDiff.isPositive ? '+' : '-'}{priceDiff.percentage}%
                    </span>
                  )
                )}
                <span className="productCard__marketPrice">
                  {formatPrice(product.mean)} {RUBLE}
                </span>

              </div>
            </div>
          )}

          {/* Диапазон цен */}
          {product.min && product.max && (
            <div className="productCard__stat">
              <span className="productCard__statLabel">Диапазон цен</span>
              <span className="productCard__statValue">
                {formatPriceRange(product.min, product.max)}
              </span>
            </div>
          )}
                {/* Кнопка перехода в магазин */}
      {product.product_url && (
        <div className="productCard__actions">
          <a
            href={product.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`productCard__shopButton productCard__shopButton_${product.source}`}
          >
            <CartIcon className="productCard__buttonIcon" size={16} />
            <span className="productCard__shopButtonText">Перейти в магазин</span>
          </a>
        </div>
      )}
        </div>

      </div>



      {/* История цен */}
      <div className="productCard__priceHistory">
        <PriceHistory priceHistory={priceHistory} />
        {priceHistory && priceHistory.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <PriceHistoryChart data={priceHistory} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 