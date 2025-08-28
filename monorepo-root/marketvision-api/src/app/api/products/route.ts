import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../routes.config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    const endpoint = query 
      ? `${API_ROUTES.PRODUCTS.path}?query=${encodeURIComponent(query)}`
      : API_ROUTES.PRODUCTS.path;

    const response = await fetchFromExternalApi(endpoint);
    const data = await response.json();
    
    const successResponse = createSuccessResponse(data);
    
    // Добавляем заголовки кеширования
    successResponse.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
    
    return successResponse;
  } catch (error) {
    console.error('Error fetching products:', error);
    return createErrorResponse(API_ROUTES.PRODUCTS.errorMessage);
  }
}

