import PriceHistoryClient from './Client';

type HistoryPoint = { price: number | null; created_at: string };

export default function PriceHistory({ priceHistory, query, source }: { priceHistory: HistoryPoint[]; query?: string; source?: string }) {
  return <PriceHistoryClient data={priceHistory} query={query} source={source} />;
}

