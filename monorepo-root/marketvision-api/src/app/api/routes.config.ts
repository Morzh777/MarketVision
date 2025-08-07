import { NextResponse } from 'next/server';

// Конфигурация API - захардкожено для простоты
const API_BASE_URL = 'https://marketvision-nginx-proxy';

// Типы для API роутов
export interface ApiRouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters?: {
    query?: string[];
    path?: string[];
  };
  errorMessage: string;
}

// Конфигурация всех API роутов
export const API_ROUTES: Record<string, ApiRouteConfig> = {
  POPULAR_QUERIES: {
    path: '/api/products/popular-queries',
    method: 'GET',
    description: 'Получение популярных запросов',
    errorMessage: 'Failed to fetch popular queries'
  },
  
  PRODUCTS: {
    path: '/api/products',
    method: 'GET',
    description: 'Получение всех продуктов или продуктов по запросу',
    parameters: {
      query: ['query']
    },
    errorMessage: 'Failed to fetch products'
  },
  
  PRODUCTS_BY_QUERY: {
    path: '/api/products-by-query/[query]',
    method: 'GET',
    description: 'Получение продуктов по конкретному запросу',
    parameters: {
      path: ['query']
    },
    errorMessage: 'Failed to fetch products by query'
  },
  
  PRICE_HISTORY_BY_QUERY: {
    path: '/api/products/price-history-by-query',
    method: 'GET',
    description: 'Получение истории цен по запросу',
    parameters: {
      query: ['query', 'limit']
    },
    errorMessage: 'Failed to fetch price history by query'
  },
  
  PRODUCT_BY_ID: {
    path: '/api/products/[id]',
    method: 'GET',
    description: 'Получение продукта по ID',
    parameters: {
      path: ['id']
    },
    errorMessage: 'Failed to fetch product'
  },
  
  PRODUCTS_PAGINATED: {
    path: '/api/products-paginated',
    method: 'GET',
    description: 'Получение продуктов с пагинацией',
    parameters: {
      query: ['page', 'limit']
    },
    errorMessage: 'Failed to fetch products with pagination'
  }
};

// Общие заголовки для всех ответов
export const COMMON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Утилиты для создания ответов
export const createSuccessResponse = (data: unknown, status: number = 200) => {
  return NextResponse.json(data, {
    status,
    headers: COMMON_HEADERS,
  });
};

export const createErrorResponse = (error: string, status: number = 500) => {
  return NextResponse.json(
    { error },
    { 
      status,
      headers: COMMON_HEADERS,
    }
  );
};

// Утилита для получения полного URL API
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Утилита для выполнения fetch запросов к внешнему API
export const fetchFromExternalApi = async (endpoint: string, options?: RequestInit) => {
  const url = getApiUrl(endpoint);
  
  console.log('[MarketVision API] Making request to:', url);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    console.error('[MarketVision API] Request failed:', {
      url,
      status: response.status,
      statusText: response.statusText
    });
    throw new Error(`API responded with status: ${response.status}`);
  }

  return response;
}; 