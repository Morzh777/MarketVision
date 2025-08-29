import './styles/components/page.scss';
import './components/Sidebar/styles.scss';
import './components/PriceHistory/styles.scss';

import { cookies } from 'next/headers';

import { API_CONFIG } from '@/config/settings';

import Sidebar from './components/Sidebar';
import TelegramIdSaver from './components/TelegramIdSaver';
import UserNav from './components/UserNav';

async function getPopularQueries(telegram_id?: string): Promise<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string; isFavorite: boolean }>> {
  // Ходим напрямую в nginx → DB API, минуя Next API
  const base = API_CONFIG.EXTERNAL_API_BASE_URL;
  const url = telegram_id 
    ? `${base}/api/products/popular-queries?telegram_id=${encodeURIComponent(telegram_id)}`
    : `${base}/api/products/popular-queries`;
    
  const res = await fetch(url, { 
    cache: 'force-cache',
    next: { revalidate: 600 } // 10 минут
  });
  if (!res.ok) return [];
  return res.json();
}

async function getFavoriteQueries(telegram_id?: string): Promise<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string; isFavorite: boolean }>> {
  console.log('🚀 getFavoriteQueries: Вызвана с telegram_id:', telegram_id);
  
  if (!telegram_id) {
    console.log('⚠️ getFavoriteQueries: telegram_id не передан, возвращаем пустой массив');
    return [];
  }
  
  try {
    // Получаем избранные запросы пользователя
    const base = API_CONFIG.EXTERNAL_API_BASE_URL;
    const timestamp = Date.now(); // Добавляем timestamp для принудительного обновления
    const favoritesResponse = await fetch(`${base}/auth/favorites/${telegram_id}?t=${timestamp}`, {
      cache: 'no-store', // Убираем кеш для избранного
      next: { revalidate: 0 } // Отключаем revalidate
    });
    
    if (!favoritesResponse.ok) {
      console.log('❌ getFavoriteQueries: Ошибка получения избранного:', favoritesResponse.status);
      return [];
    }
    
    const favoritesData = await favoritesResponse.json();
    if (!favoritesData.success || !favoritesData.favorites) {
      console.log('⚠️ getFavoriteQueries: Нет данных избранного в ответе');
      return [];
    }
    
    console.log('✅ getFavoriteQueries: Получено избранных запросов:', favoritesData.favorites.length);
    
    // Для каждого избранного запроса получаем информацию о продукте
    const favoriteQueries = await Promise.all(
      favoritesData.favorites.map(async (favorite: { query: string }) => {
        console.log('🔍 getFavoriteQueries: Обрабатываем избранный запрос:', favorite.query);
        
        // Получаем информацию о продукте по query
        const productResponse = await fetch(`${base}/api/products/products-by-query/${encodeURIComponent(favorite.query)}?t=${timestamp}`, {
          cache: 'no-store', // Убираем кеш для продуктов избранного
          next: { revalidate: 0 } // Отключаем revalidate
        });
        
        if (!productResponse.ok) {
          console.log('❌ getFavoriteQueries: Ошибка API для query:', favorite.query, 'Status:', productResponse.status);
          return null;
        }
        
        const productData = await productResponse.json();
        console.log('📊 getFavoriteQueries: Ответ API для query:', favorite.query, 'Data:', productData);
        
        if (!productData.products || productData.products.length === 0) {
          console.log('⚠️ getFavoriteQueries: Нет продуктов для query:', favorite.query);
          return null;
        }
        
        const product = productData.products[0]; // Берем первый продукт
        console.log('✅ getFavoriteQueries: Найден продукт для query:', favorite.query, 'Product:', product);
        
        return {
          query: favorite.query,
          minPrice: product.price,
          id: product.id,
          priceChangePercent: 0, // TODO: добавить расчет изменения цены
          image_url: product.image_url || '',
          isFavorite: true,
          category: product.category
        };
      })
    );
    
    const filteredQueries = favoriteQueries.filter((q): q is NonNullable<typeof q> => q !== null);
    console.log('✅ getFavoriteQueries: Успешно обработано избранных запросов:', filteredQueries.length);
    return filteredQueries;
  } catch (error) {
    console.error('❌ getFavoriteQueries: Ошибка получения избранного:', error);
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; telegram_id?: string; category?: string }>;
}) {
  // Await searchParams для Next.js 15
  const resolvedSearchParams = await searchParams;
  
  // Получаем telegram_id из URL параметров (приоритет) или из cookie
  const cookieStore = await cookies();
  const telegram_id = resolvedSearchParams.telegram_id || 
                     cookieStore.get('telegram_id_client')?.value || 
                     cookieStore.get('telegram_id')?.value;
  
  console.log('🔍 Home: Получаем данные для telegram_id:', telegram_id, {
    fromUrl: resolvedSearchParams.telegram_id,
    fromCookie: cookieStore.get('telegram_id_client')?.value || cookieStore.get('telegram_id')?.value,
    allSearchParams: Object.fromEntries(Object.entries(resolvedSearchParams)),
    allCookies: Object.fromEntries(
      cookieStore.getAll().map(cookie => [cookie.name, cookie.value])
    )
  });
  
  const popularQueries = await getPopularQueries(telegram_id);
  const favoriteQueries = telegram_id ? await getFavoriteQueries(telegram_id) : [];
  
  console.log('📊 Home: Получены данные:', {
    popularQueriesCount: popularQueries?.length || 0,
    favoriteQueriesCount: favoriteQueries?.length || 0,
    telegram_id,
    filter: resolvedSearchParams.filter,
    category: resolvedSearchParams.category
  });
  
  // Серверный рендер: без client-хуков, только пропсы вниз
  return (
    <div className="page">
      <Sidebar 
        popularQueries={popularQueries || []} 
        favoriteQueries={favoriteQueries || []} 
        initialFilter={resolvedSearchParams.filter}
        initialCategory={resolvedSearchParams.category}
        telegram_id={telegram_id}
      />
      <TelegramIdSaver telegram_id={telegram_id} />
      <UserNav />
    </div>
  );
}
