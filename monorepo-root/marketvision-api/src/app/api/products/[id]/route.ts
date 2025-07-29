import { 
  fetchFromExternalApi, 
  createSuccessResponse, 
  createErrorResponse,
  API_ROUTES 
} from '../../routes.config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const endpoint = `${API_ROUTES.PRODUCT_BY_ID.path.replace('[id]', id)}`;
    
    const response = await fetchFromExternalApi(endpoint);
    const data = await response.json();
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return createErrorResponse(API_ROUTES.PRODUCT_BY_ID.errorMessage);
  }
} 