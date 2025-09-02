import { API_CONFIG } from '@/config/settings';
import AdminPage from '@/app/components/admin';

async function getCategories() {
  const base = API_CONFIG.EXTERNAL_API_BASE_URL;
  const res = await fetch(`${base}/api/categories`, {
    cache: 'no-store'
  });
  if (!res.ok) return [];
  return res.json();
}

async function getQueries(categoryKey: string) {
  const base = API_CONFIG.EXTERNAL_API_BASE_URL;
  const res = await fetch(`${base}/api/categories/queries?categoryKey=${encodeURIComponent(categoryKey)}`, {
    cache: 'no-store'
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function AdminPageRoute() {
  // Получаем данные на сервере
  const categories = await getCategories();
  const initialQueries = categories.length > 0 ? await getQueries(categories[0].key) : [];

  return (
    <AdminPage 
      initialCategories={categories}
      initialQueries={initialQueries}
      initialSelectedKey={categories.length > 0 ? categories[0].key : ''}
    />
  );
}