import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../routes.config';

export async function GET() {
  try {
    console.log('[MarketVision API] Fetching popular queries from DB API...');
    const response = await fetchFromExternalApi(API_ROUTES.POPULAR_QUERIES.path);
    const data = await response.json();
    
    console.log('[MarketVision API] Received data from DB API:', {
      totalQueries: data.length,
      queries: data.map((q: any) => q.query)
    });
    
    // Проверяем, есть ли RTX 5090 в ответе
    const rtx5090 = data.find((q: any) => q.query === 'rtx 5090');
    if (rtx5090) {
      console.log('[MarketVision API] RTX 5090 found:', rtx5090);
    } else {
      console.log('[MarketVision API] RTX 5090 NOT found in response');
    }
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching popular queries:', error);
    return createErrorResponse(API_ROUTES.POPULAR_QUERIES.errorMessage);
  }
} 