import type { PopularQuery } from '../../types/market';

import Client from './Client';

export default function Sidebar({ 
  popularQueries, 
  favoriteQueries, 
  initialFilter,
  initialCategory,
  telegram_id
}: { 
  popularQueries: PopularQuery[]; 
  favoriteQueries: PopularQuery[];
  initialFilter?: string;
  initialCategory?: string;
  telegram_id?: string;
}) {
  return <Client 
    popularQueries={popularQueries} 
    favoriteQueries={favoriteQueries} 
    initialFilter={initialFilter}
    initialCategory={initialCategory}
    telegram_id={telegram_id}
  />;
}

