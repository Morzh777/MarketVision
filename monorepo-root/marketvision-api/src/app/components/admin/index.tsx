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
  platform: 'ozon' | 'wb';
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
