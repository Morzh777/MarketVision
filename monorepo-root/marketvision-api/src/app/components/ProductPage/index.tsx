import type { ProductView } from '../../types/market';

import Client from './Client';

export default function ProductPage({ product, priceHistory, decodedQuery }: { product: ProductView | null; priceHistory: Array<{ price: number | null; created_at: string }>; decodedQuery: string }) {
  return <Client product={product} priceHistory={priceHistory} decodedQuery={decodedQuery} />;
}


