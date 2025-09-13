import { EmptyState } from './EmptyState'
import { HeartIcon, ArrowLeftIcon } from '@/components/ui/Icons'
import Link from 'next/link'

export const FavoritesEmpty = () => {
  return (
    <div className="favoritesEmpty">
      <div className="favoritesEmpty__header">
        <Link href="/" className="favoritesEmpty__backButton">
          <ArrowLeftIcon size={20} />
        </Link>
      </div>
      
      <EmptyState
        icon={<HeartIcon size={64} className="favoritesEmpty__heartIcon" />}
        title="Пока ничего не добавлено в избранное"
        description="Найдите интересные товары и добавьте их в избранное, чтобы отслеживать изменения цен"
        action={
          <Link href="/" className="favoritesEmpty__goToProductsButton">
            <ArrowLeftIcon size={16} />
            <span>Перейти к товарам</span>
          </Link>
        }
      />
    </div>
  )
}
