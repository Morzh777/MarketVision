import { NextRequest } from 'next/server';

import { addCacheHeaders, POPULAR_QUERIES_CACHE } from '@/utils/cache';

import { 
  fetchFromExternalApi, 
  API_ROUTES,
  createSuccessResponse,
  createErrorResponse
} from '../routes.config';

interface PopularQuery {
  query: string;
  count?: number;
  isFavorite?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegram_id = searchParams.get('telegram_id');
    
    console.log('[MarketVision API] Fetching popular queries from DB API...', { telegram_id });
    
    // Формируем URL с telegram_id если он передан
    const url = telegram_id 
      ? `${API_ROUTES.POPULAR_QUERIES.path}?telegram_id=${encodeURIComponent(telegram_id)}`
      : API_ROUTES.POPULAR_QUERIES.path;
      
    const response = await fetchFromExternalApi(url);
    const data = await response.json();
    
    console.log('[MarketVision API] Received data from DB API:', {
      totalQueries: data.length,
      queries: data.map((q: PopularQuery) => ({ query: q.query, isFavorite: q.isFavorite }))
    });
    
    const successResponse = createSuccessResponse(data);
    
    // Добавляем заголовки кеширования
    return addCacheHeaders(successResponse, POPULAR_QUERIES_CACHE);
  } catch {
    console.error('Error fetching popular queries');
    return createErrorResponse(API_ROUTES.POPULAR_QUERIES.errorMessage);
  }
} 