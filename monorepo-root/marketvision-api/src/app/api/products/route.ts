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
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return createErrorResponse(API_ROUTES.PRODUCTS.errorMessage);
  }
}

