/**
 * Centralized runtime settings for MarketVision API.
 * Keep secrets (API tokens) in environment. Everything else stays here.
 */

// HTTP port
export const SERVICE_PORT = 3006;

// API configuration
export const API_CONFIG = {
  // Base URL for external API calls (used in routes.config.ts)
  EXTERNAL_API_BASE_URL: 'http://marketvision-nginx-proxy:8080',
  
  // Local API base URL for internal calls
  LOCAL_API_BASE_URL: '/api',
  
  // Product filter service URL
  PRODUCT_FILTER_URL: 'http://marketvision-product-aggregator:3001',
  
  // DB API REST URL (internal Docker network)
  DB_API_URL: 'http://marketvision-database-api:3004',
  
  // Public API URL for external access
  NEXT_PUBLIC_API_URL: 'http://marketvision-nginx-proxy:8080',

  // Parsers
  WB_API_URL: 'http://marketvision-wb-parser:3000',
  OZON_API_URL: 'http://marketvision-ozon-parser:3002',
} as const;

// Environment configuration (static defaults)
export const ENV_CONFIG = {
  NODE_ENV: 'development',
  NODE_TLS_REJECT_UNAUTHORIZED: '0',
} as const;

// CORS configuration
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3006',
    'https://*.serveo.net',
    'http://*.serveo.net',
    'https://marketvisionpro.ru',
    'https://www.marketvisionpro.ru',
  ],
  
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
} as const;

// Image configuration for Next.js
export const IMAGE_CONFIG = {
  REMOTE_PATTERNS: [
    {
      protocol: 'https',
      hostname: 'cdn1.ozone.ru',
    },
    {
      protocol: 'https', 
      hostname: 'ir.ozone.ru',
    },
    {
      protocol: 'https',
      hostname: '*.wbbasket.ru',
    },
  ],
} as const;

// Logging configuration
export const LOG_CONFIG = {
  LEVEL: 'info' as const,
  FILE: 'logs/marketvision-api.log',
} as const;

// Health check configuration
export const HEALTH_CHECK_CONFIG = {
  ENDPOINT: '/health',
  INTERVAL: 30000, // 30 seconds
  TIMEOUT: 10000,  // 10 seconds
  RETRIES: 3,
  START_PERIOD: 40000, // 40 seconds
} as const;
