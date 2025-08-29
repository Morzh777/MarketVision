import type { ProductView } from '../../types/market';

import Client from './Client';

export default function ProductPage({ 
  product, 
  priceHistory, 
  decodedQuery,
  telegram_id 
}: { 
  product: ProductView | null; 
  priceHistory: Array<{ price: number | null; created_at: string }>; 
  decodedQuery: string;
  telegram_id?: string;
}) {
  return <Client product={product} priceHistory={priceHistory} decodedQuery={decodedQuery} telegram_id={telegram_id} />;
}


