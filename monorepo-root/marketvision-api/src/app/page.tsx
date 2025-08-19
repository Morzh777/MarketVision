import './styles/components/page.scss';
import './components/Sidebar/styles.scss';
import './components/PriceHistory/styles.scss';
import Sidebar from './components/Sidebar';
import { API_CONFIG } from '@/config/settings';

async function getPopularQueries(): Promise<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string }>> {
  // Ходим напрямую в nginx → DB API, минуя Next API
  const base = API_CONFIG.EXTERNAL_API_BASE_URL;
  const res = await fetch(`${base}/api/products/popular-queries`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function Home() {
  const popularQueries = await getPopularQueries();
  // Серверный рендер: без client-хуков, только пропсы вниз
  return (
    <div className="page">
      <Sidebar popularQueries={popularQueries} />
    </div>
  );
}
