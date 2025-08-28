import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../../routes.config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') || '10';
    
    if (!query) {
      return createErrorResponse('Query parameter is required', 400);
    }

    const endpoint = `${API_ROUTES.PRICE_HISTORY_BY_QUERY.path}?query=${encodeURIComponent(query)}&limit=${limit}`;
    
    const response = await fetchFromExternalApi(endpoint);
    const data = await response.json();
    
    const successResponse = createSuccessResponse(data);
    
    // Добавляем заголовки кеширования
    successResponse.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
    
    return successResponse;
  } catch (error) {
    console.error('Error fetching price history by query:', error);
    return createErrorResponse(API_ROUTES.PRICE_HISTORY_BY_QUERY.errorMessage);
  }
} 