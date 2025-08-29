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

  if (!telegram_id) {
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
      return [];
    }

    const favoritesData = await favoritesResponse.json();
    if (!favoritesData.success || !favoritesData.favorites) {
      return [];
    }

    // Для каждого избранного запроса получаем информацию о продукте
    const favoriteQueries = await Promise.all(
      favoritesData.favorites.map(async (favorite: { query: string }) => {

        // Получаем информацию о продукте по query
        const productResponse = await fetch(`${base}/api/products/products-by-query/${encodeURIComponent(favorite.query)}?t=${timestamp}`, {
          cache: 'no-store', // Убираем кеш для продуктов избранного
          next: { revalidate: 0 } // Отключаем revalidate
        });

        if (!productResponse.ok) {
          return null;
        }

        const productData = await productResponse.json();

        if (!productData.products || productData.products.length === 0) {
          return null;
        }

        const product = productData.products[0]; // Берем первый продукт

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
    return filteredQueries;
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; telegram_id?: string; category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const telegram_id = resolvedSearchParams.telegram_id ||
                     cookieStore.get('telegram_id_client')?.value ||
                     cookieStore.get('telegram_id')?.value;

  const popularQueries = await getPopularQueries(telegram_id);
  const favoriteQueries = telegram_id ? await getFavoriteQueries(telegram_id) : [];

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
