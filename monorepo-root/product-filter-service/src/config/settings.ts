
// HTTP port
export const SERVICE_PORT = 3001;

// Upstream gRPC services inside Docker network
export const WB_API_ADDRESS = 'marketvision-wb-parser:3000';
export const OZON_API_ADDRESS = 'marketvision-ozon-parser:3002';
export const DB_API_ADDRESS = 'marketvision-database-api:50051';

// Logging
export const LOG_LEVEL: 'info' | 'debug' | 'warn' | 'error' = 'info';
export const LOG_FILE = 'logs/product-filter.log';


