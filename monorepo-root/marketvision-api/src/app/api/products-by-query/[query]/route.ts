import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../../routes.config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params;
    const decodedQuery = decodeURIComponent(query);
    const endpoint = `${API_ROUTES.PRODUCTS_BY_QUERY.path.replace('[query]', encodeURIComponent(decodedQuery))}`;
    
    console.log('[MarketVision API] Products by query endpoint:', endpoint);
    
    const response = await fetchFromExternalApi(endpoint);
    const data = await response.json();
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching products by query:', error);
    return createErrorResponse(API_ROUTES.PRODUCTS_BY_QUERY.errorMessage);
  }
} 