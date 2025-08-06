import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../routes.config';

interface PopularQuery {
  query: string;
  count?: number;
}

export async function GET() {
  try {
    console.log('[MarketVision API] Fetching popular queries from DB API...');
    const response = await fetchFromExternalApi(API_ROUTES.POPULAR_QUERIES.path);
    const data = await response.json();
    
    console.log('[MarketVision API] Received data from DB API:', {
      totalQueries: data.length,
      queries: data.map((q: PopularQuery) => q.query)
    });
    
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching popular queries:', error);
    return createErrorResponse(API_ROUTES.POPULAR_QUERIES.errorMessage);
  }
} 