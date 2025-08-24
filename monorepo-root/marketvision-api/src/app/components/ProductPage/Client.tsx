"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { RUBLE, formatPrice, formatPriceRange } from '../../utils/currency';
import { decodeHtmlEntities } from '../../utils/html';
import BackButton from '../BackButton';
import { ArrowLeftIcon, CartIcon, HeartIcon, ShareIcon, TrendDownChartIcon, TrendUpChartIcon } from '../Icons';
import './styles.scss';
import PriceHistory from '../PriceHistory';

type PricePoint = { price: number | null; created_at: string };

export interface ProductPageClientProps {
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
  priceHistory: PricePoint[];
  decodedQuery: string;
}

export default function Client({ product, priceHistory, decodedQuery }: ProductPageClientProps) {
  const router = useRouter();
  const [swipeVisible, setSwipeVisible] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const THRESHOLD = 80;     // порог для возврата (px)
  const ANGLE_GUARD = 10;   // насколько горизонталь должна превосходить вертикаль (px)

  const handlers = useSwipeable({
    onSwiping: (e) => {
      const isHorizontal = e.absX > e.absY + ANGLE_GUARD;
      if (isHorizontal && e.deltaX > 0) {
        setSwipeVisible(true);
        const p = Math.min(1, e.absX / THRESHOLD);
        setSwipeProgress(p);
      } else {
        setSwipeVisible(false);
        setSwipeProgress(0);
      }
    },
    onSwipedRight: (e) => {
      const isHorizontal = e.absX > e.absY + ANGLE_GUARD;
      if (isHorizontal && e.absX >= THRESHOLD) {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/');
      }
      setSwipeVisible(false);
      setSwipeProgress(0);
    },
    onSwiped: () => {
      setSwipeVisible(false);
      setSwipeProgress(0);
    },
    trackTouch: true,
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 10,
    touchEventOptions: { passive: true },
  });

  return (
    <div className="productPage" {...handlers}>
      {swipeVisible && (
        <div
          className="productPage__swipeIndicator"
          style={{
            opacity: 0.2 + 0.8 * swipeProgress,
            transform: `translateY(-50%) scale(${0.9 + 0.2 * swipeProgress})`,
          }}
        >
          <ArrowLeftIcon size={22} />
        </div>
      )}

      <div className="productPage__topBar">
        <div className="productPage__topBarLeft">
          <BackButton className="productPage__topBarButton" ariaLabel="Назад">
            <ArrowLeftIcon size={28} />
          </BackButton>
        </div>
        <div className="productPage__topBarRight">
          <button className="productPage__topBarButton" aria-label="Избранное">
            <HeartIcon size={26} />
          </button>
          <button className="productPage__topBarButton" aria-label="Поделиться">
            <ShareIcon size={26} />
          </button>
        </div>
      </div>

      <div className="productPage__content">
        {product ? (
          <InlineProductCard product={product} priceHistory={priceHistory} />
        ) : (
          <div className="productPage__loading">
            <p>Товар не найден</p>
            <p>Query: {decodedQuery}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InlineProductCard({
  product,
  priceHistory = [],
}: {
  product: ProductPageClientProps['product'];
  priceHistory: PricePoint[];
}) {
  const getPriceTrend = (): 'up' | 'down' | 'stable' => {
    if (!priceHistory || priceHistory.length < 2) return 'stable';
    const recent = [...priceHistory]
      .filter((p) => p.price !== null && p.price !== undefined)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (recent.length < 2) return 'stable';
    const current = recent[0].price as number;
    const previous = recent[1].price as number;
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return 'stable';
    const change = ((current - previous) / previous) * 100;
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
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

  const priceDiff = product.mean && product.price !== product.mean
    ? {
        percentage: Math.round((Math.abs(product.mean - product.price) / product.mean) * 100),
        isPositive: product.price < product.mean,
      }
    : null;
  const trend = getPriceTrend();

  const nameElement = product.product_url ? (
    <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="productCard__name">
      {decodeHtmlEntities(product.name)}
    </a>
  ) : (
    <h2 className="productCard__name">{decodeHtmlEntities(product.name)}</h2>
  );

  const priceElement = product.product_url ? (
    <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="productCard__price productCard__price_link">
      {formatPrice(product.price)} {RUBLE}
    </a>
  ) : (
    <span className="productCard__price">{formatPrice(product.price)} {RUBLE}</span>
  );

  return (
    <div className="productCard">
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
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
          />
        ) : (
          <div className="productCard__imagePlaceholder">
            <div className="productCard__placeholderIcon">📷</div>
            <span>Нет фото</span>
          </div>
        )}

        <div className="productCard__tags">
          {product.source && (
            <div className={`productCard__tag productCard__tag_source productCard__tag_${product.source}`}>
              {product.source.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="productCard__infoSection">{nameElement}</div>

      <div className="productCard__pricingSection">
        <div className="productCard__priceBlock">
          <span className="productCard__priceLabel">Текущая цена</span>
          <div className="productCard__priceRow">
            <div className="productCard__priceContent">
              <div className="productCard__priceLine">
                {trend !== 'stable' && (
                  (trend === 'up' ? (
                    <TrendUpChartIcon className={`productCard__trendIcon trend-${trend}`} size={16} />
                  ) : (
                    <TrendDownChartIcon className={`productCard__trendIcon trend-${trend}`} size={16} />
                  ))
                )}
                {priceElement}
              </div>
            </div>
          </div>
        </div>

        <div className="productCard__stats">
          {product.mean && (
            <div className="productCard__stat">
              <span className="productCard__statLabel">Рыночная цена</span>
              <div className="productCard__statValue">
                {priceDiff && (
                  <span className={`productCard__priceDiff ${priceDiff.isPositive ? 'productCard__priceDiff_positive' : 'productCard__priceDiff_negative'}`}>
                    {priceDiff.isPositive ? '+' : '-'}{priceDiff.percentage}%
                  </span>
                )}
                <span className="productCard__marketPrice">{formatPrice(product.mean)} {RUBLE}</span>
              </div>
            </div>
          )}

          {product.min && product.max && (
            <div className="productCard__stat">
              <span className="productCard__statLabel">Диапазон цен</span>
              <span className="productCard__statValue">{formatPriceRange(product.min, product.max)}</span>
            </div>
          )}

          {product.product_url && (
            <div className="productCard__actions">
              <a href={product.product_url} target="_blank" rel="noopener noreferrer" className={`productCard__shopButton productCard__shopButton_${product.source}`}>
                <CartIcon className="productCard__buttonIcon" size={16} />
                <span className="productCard__shopButtonText">Перейти в магазин</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="productCard__priceHistory">
    <PriceHistory priceHistory={priceHistory} query={product?.query} source={product?.source} />
</div>
    </div>
  );
}


