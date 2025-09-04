import Client from './Client';

type Category = { 
  id: number; 
  key: string; 
  display: string; 
  ozon_id?: string | null; 
  wb_id?: string | null; 
};

type QueryCfg = {
  id: number;
  query: string;
  platform_id?: string | null;
  exactmodels?: string | null;
  wb_platform_id?: string | null;
  wb_exactmodels?: string | null;
  platform: 'ozon' | 'wb';
  recommended_price?: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPage({ 
  initialCategories, 
  initialQueries, 
  initialSelectedKey 
}: { 
  initialCategories: Category[]; 
  initialQueries: QueryCfg[];
  initialSelectedKey: string;
}) {
  return (
    <Client 
      initialCategories={initialCategories}
      initialQueries={initialQueries}
      initialSelectedKey={initialSelectedKey}
    />
  );
}

// Экспорты для использования в других компонентах
export { useConfirmDialog } from './useConfirmDialog';
