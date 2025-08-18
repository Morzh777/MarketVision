import type { PopularQuery } from '../../types/market';

import Client from './Client';

export default function Sidebar({ popularQueries }: { popularQueries: PopularQuery[] }) {
  return <Client popularQueries={popularQueries} />;
}

