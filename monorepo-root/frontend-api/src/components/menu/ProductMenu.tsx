import ProductMenuClient from './ProductMenuClient'

interface ProductMenuProps {
  query: string
  telegram_id?: string
  initialIsFavorite?: boolean
}

export default function ProductMenu({ query, telegram_id, initialIsFavorite }: ProductMenuProps) {
  return <ProductMenuClient query={query} telegram_id={telegram_id} initialIsFavorite={initialIsFavorite} />
}
