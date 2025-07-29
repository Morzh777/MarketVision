import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../routes.config';

export async function GET() {
  try {
    const response = await fetchFromExternalApi(API_ROUTES.POPULAR_QUERIES.path);
    const data = await response.json();
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching popular queries:', error);
    return createErrorResponse(API_ROUTES.POPULAR_QUERIES.errorMessage);
  }
} 