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

const ProductPage: React.FC<ProductPageProps> = ({ params }) => {
  const { query } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ price: number | null; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Минимальное расстояние для свайпа
  const minSwipeDistance = 50;

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        
        // Получаем продукт по query
        const apiUrl = `/api/products-by-query/${encodeURIComponent(query)}`;
        console.log('Fetching from URL:', apiUrl);
        const productResponse = await fetch(apiUrl);
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
              setPriceHistory(responseData.priceHistory);
            } else {
              console.log('No price history in response');
            }
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