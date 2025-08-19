/**
 * Centralized runtime settings for DB-API service.
 * Only database connection URL should come from environment via Prisma (DATABASE_URL).
 * Everything else is configured here to avoid scattering env variables.
 */

// HTTP port for REST API endpoints
export const REST_PORT = 3004;

// gRPC server bind URL
export const GRPC_BIND_URL = '0.0.0.0:50051';

// Allowed CORS origins for REST API
export const CORS_ORIGINS: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3006',
  'https://marketvisionpro.ru',
  'https://*.serveo.net',
  'http://*.serveo.net',
];


