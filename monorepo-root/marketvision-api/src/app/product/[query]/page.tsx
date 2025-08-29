import { cookies } from 'next/headers';

import '../../components/ProductPage/styles.scss';

import { API_CONFIG } from '@/config/settings';

import ProductPageClient from '../../components/ProductPage';

interface ServerProps { 
  params: Promise<{ query: string }>;
  searchParams: Promise<{ telegram_id?: string }>;
}

export default async function ProductPage({ params, searchParams }: ServerProps) {
  const { query } = await params;
  const resolvedSearchParams = await searchParams;
  const decodedQuery = decodeURIComponent(query);
  
  console.log('🔍 ProductPage: Все параметры:', {
    params: { query },
    searchParams: resolvedSearchParams,
    decodedQuery
  });
  
  // Получаем telegram_id из URL параметров (приоритет) или из cookies
  const cookieStore = await cookies();
  const telegram_id = resolvedSearchParams.telegram_id || 
                     cookieStore.get('telegram_id_client')?.value || 
                     cookieStore.get('telegram_id')?.value;
  
  console.log('🔍 ProductPage: Получаем telegram_id:', telegram_id, {
    fromUrl: resolvedSearchParams.telegram_id,
    fromCookie: cookieStore.get('telegram_id_client')?.value || cookieStore.get('telegram_id')?.value,
    allCookies: Object.fromEntries(
      cookieStore.getAll().map(cookie => [cookie.name, cookie.value])
    )
  });
  
  const base = API_CONFIG.EXTERNAL_API_BASE_URL;
  // 1) Получаем сам продукт из общего списка (без строгого фильтра по цене)
  let productListRes: Response | null = null;
  try {
    productListRes = await fetch(`${base}/api/products?query=${encodeURIComponent(decodedQuery)}`, { 
      cache: 'force-cache',
      next: { revalidate: 600 } // 10 минут
    });
  } catch {
    productListRes = null;
  }

  let product: {
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
  } | null = null;
  let priceHistory: Array<{ price: number | null; created_at: string }> = [];

  if (productListRes?.ok) {
    const listData = await productListRes.json();
    if (Array.isArray(listData) && listData.length > 0) {
      product = listData[0];
    } else if (listData?.products?.length) {
      product = listData.products[0];
    }
  }

  // 2) Отдельно подтягиваем статистику и историю цен
  try {
    const resStats = await fetch(`${base}/api/products-by-query/${encodeURIComponent(decodedQuery)}`, { 
      cache: 'force-cache',
      next: { revalidate: 600 } // 10 минут
    });
    if (resStats.ok) {
      const d = await resStats.json();
      const ms = d?.marketStats;
      if (ms && product) {
        product.min = ms.min;
        product.max = ms.max;
        product.mean = ms.mean;
        product.median = ms.median;
        product.iqr = ms.iqr;
      }
      priceHistory = Array.isArray(d?.priceHistory)
        ? [...d.priceHistory].sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];
      // если продукта ещё нет, но API вернул products, возьмём оттуда
      if (!product && d?.products?.length) {
        product = d.products[0];
      }
    }
  } catch {}

  // Без нормализации: ищем только по исходной строке из URL

  return (
    <div className="productPage">
      <div className="productPage__content">
        {product ? (
          <ProductPageClient product={product} priceHistory={priceHistory} decodedQuery={decodedQuery} telegram_id={telegram_id} />
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