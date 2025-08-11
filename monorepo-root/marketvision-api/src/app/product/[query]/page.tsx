'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';

import ProductCard from '../../components/ProductCard';
import { Product } from '../../types/market';
import '../../styles/components/product-page.scss';

interface ProductPageProps {
  params: Promise<{
    query: string;
  }>;
}

// Глобальный дедупликатор запросов в dev (React Strict Mode вызывает mount дважды)
const inFlightQueries = new Set<string>();

const ProductPage: React.FC<ProductPageProps> = ({ params }) => {
  const { query } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ price: number | null; created_at: string }>>([]);
  const [priceChangePercent, setPriceChangePercent] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Минимальное расстояние для свайпа
  const minSwipeDistance = 50;

  useEffect(() => {
    // Берём кэш популярок, если есть, чтобы сразу отобразить тренд как в сайдбаре
    try {
      const raw = sessionStorage.getItem('popularQueryPctMap');
      if (raw) {
        const parsed = JSON.parse(raw) as { updatedAt: number; map: Record<string, number> };
        const key = decodeURIComponent(query).toLowerCase().replace(/\s+/g, ' ').trim();
        const pct = parsed?.map?.[key];
        if (typeof pct === 'number') {
          setPriceChangePercent(pct);
        }
      }
    } catch {}

    const fetchProductData = async () => {
      try {
        setLoading(true);
        const key = query.toLowerCase().trim();
        // 1) Проверяем кэш по запросу (sessionStorage)
        try {
          const RAW_CACHE = sessionStorage.getItem('productsByQueryCache');
          const CACHE_TTL_MS = 2 * 60 * 1000; // 2 минуты
          if (RAW_CACHE) {
            const parsed = JSON.parse(RAW_CACHE) as { [k: string]: { updatedAt: number; data: any } };
            const cached = parsed?.[key];
            if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
              const responseData = cached.data;
              if (responseData?.products && Array.isArray(responseData.products) && responseData.products.length > 0) {
                const product = responseData.products[0];
                if (responseData.marketStats) {
                  product.min = responseData.marketStats.min;
                  product.max = responseData.marketStats.max;
                  product.mean = responseData.marketStats.mean;
                  product.median = responseData.marketStats.median;
                  product.iqr = responseData.marketStats.iqr;
                }
                setProduct(product);
                if (responseData.priceHistory) {
                  setPriceHistory(responseData.priceHistory);
                }
                setLoading(false);
                return; // выходим, сеть не нужна
              }
            }
          }
        } catch {}

        if (inFlightQueries.has(key)) {
          return; // Дедупликация повторного вызова эффекта в dev
        }
        inFlightQueries.add(key);

        const abort = new AbortController();
        const { signal } = abort;

        // Получаем продукт по query
        const apiUrl = `/api/products-by-query/${encodeURIComponent(query)}`;
        console.log('Fetching from URL:', apiUrl);
        const productResponse = await fetch(apiUrl, { signal });
        console.log('Product response status:', productResponse.status);
        if (productResponse.ok) {
          const responseData = await productResponse.json();
          console.log('Response data:', responseData);
          
          // Проверяем структуру ответа
          console.log('Response data structure:', {
            hasProducts: !!responseData.products,
            isArray: Array.isArray(responseData.products),
            length: responseData.products?.length,
            products: responseData.products
          });
          
          if (responseData.products && Array.isArray(responseData.products) && responseData.products.length > 0) {
            const product = responseData.products[0];
            console.log('Found product:', product);
            
            // Добавляем marketStats к продукту
            if (responseData.marketStats) {
              product.min = responseData.marketStats.min;
              product.max = responseData.marketStats.max;
              product.mean = responseData.marketStats.mean;
              product.median = responseData.marketStats.median;
              product.iqr = responseData.marketStats.iqr;
            }
            
            setProduct(product);
            
            // Устанавливаем историю цен из того же ответа
            if (responseData.priceHistory) {
              console.log('Setting price history from response:', responseData.priceHistory);
              console.log('Price history details:', {
                length: responseData.priceHistory.length,
                first: responseData.priceHistory[0],
                last: responseData.priceHistory[responseData.priceHistory.length - 1],
                all: responseData.priceHistory
              });
              // Берем последние 5 (бек уже вернёт distinct)
              const sorted = [...responseData.priceHistory]
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);
              setPriceHistory(sorted);
              // Тренд берём из кэша (как в сайдбаре). Если кэша нет — не пересчитываем тут.
            } else {
              console.log('No price history in response');
              setPriceChangePercent(undefined);
            }

            // 2) Сохраняем в кэш
            try {
              const RAW_CACHE = sessionStorage.getItem('productsByQueryCache');
              const parsed = RAW_CACHE ? JSON.parse(RAW_CACHE) : {};
              parsed[key] = { updatedAt: Date.now(), data: responseData };
              sessionStorage.setItem('productsByQueryCache', JSON.stringify(parsed));
            } catch {}
          } else {
            console.log('No products found in response');
            setProduct(null);
          }
        } else {
          console.error('Product response error:', productResponse.status, productResponse.statusText);
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
      } finally {
        inFlightQueries.delete(query.toLowerCase().trim());
        setLoading(false);
      }
    };

    if (query) {
      fetchProductData();
    }
  }, [query]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe) {
      // Свайп справа налево - закрываем страницу
      router.back();
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleCloseClick = () => {
    router.back();
  };



  if (loading) {
    return (
      <div className="productPage">
        <div className="productPage__header">
          <button className="productPage__button" onClick={handleBackClick}>
            ←
          </button>
          <button className="productPage__button" onClick={handleCloseClick}>
            ×
          </button>
        </div>
        <div className="productPage__loading">
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="productPage"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="productPage__header">
        <button className="productPage__button" onClick={handleBackClick}>
          ←
        </button>
        <button className="productPage__button" onClick={handleCloseClick}>
          ×
        </button>
      </div>

      <div className="productPage__content">
        {loading ? (
          <div className="productPage__loading">
            <p>Загрузка данных...</p>
          </div>
        ) : product ? (
          <ProductCard 
            product={product} 
            priceHistory={priceHistory}
            priceChangePercent={priceChangePercent}
          />
        ) : (
          <div className="productPage__loading">
            <p>Товар не найден</p>
            <p>Query: {query}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage; 