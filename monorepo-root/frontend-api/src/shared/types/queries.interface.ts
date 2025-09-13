// Интерфейсы для запросов по стандарту DB API

export interface QueryConfig {
  id: number;
  query: string;
  platform_id?: string | null;
  exactmodels?: string | null;
  wb_platform_id?: string | null;
  wb_exactmodels?: string | null;
  platform: 'ozon' | 'wb' | 'both';
  recommended_price?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  key: string;
  display: string;
  ozon_id?: string | null;
  wb_id?: string | null;
}

export interface CreateQueryRequest {
  query: string;
  platform_id?: string;
  exactmodels?: string;
  wb_platform_id?: string;
  wb_exactmodels?: string;
  platform: 'ozon' | 'wb' | 'both';
  recommended_price?: number;
  categoryKey: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface UpdateQueryRequest {
  id: number;
  query: string;
  platform_id?: string;
  exactmodels?: string;
  wb_platform_id?: string;
  wb_exactmodels?: string;
  platform: 'ozon' | 'wb' | 'both';
  recommended_price?: number;
  categoryKey: string;
  isGroup?: boolean; // Флаг, что это группа запросов
  groupIds?: number[]; // ID всех запросов в группе
}
