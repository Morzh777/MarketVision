import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../routes.config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    
    const endpoint = `${API_ROUTES.PRODUCTS_PAGINATED.path}?page=${page}&limit=${limit}`;
    
    const response = await fetchFromExternalApi(endpoint);
    const data = await response.json();
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching products with pagination:', error);
    return createErrorResponse(API_ROUTES.PRODUCTS_PAGINATED.errorMessage);
  }
} 