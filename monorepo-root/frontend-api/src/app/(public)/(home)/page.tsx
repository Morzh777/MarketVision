
import { InfiniteScrollProducts } from '@/components/products/InfiniteScrollProducts'
import { FavoritesEmpty } from '@/components/empty/FavoritesEmpty'
import { cookies } from 'next/headers'
import { buildProductApiUrl, getFilterParams } from '@/utils/productFilters'
import HomeLayout from './layout'

import '@/app/styles/components/home-page.scss'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function HomePage({ searchParams }: Props) {
  // Получаем параметры фильтрации
  const resolvedSearchParams = await searchParams
  const filterParams = getFilterParams(resolvedSearchParams)
  
  // Получаем telegram_id из cookies
  const cookieStore = await cookies()
  const telegram_id = cookieStore.get('telegram_id')?.value

  // Формируем URL для API с учетом фильтров
  const apiUrl = buildProductApiUrl({
    ...filterParams,
    telegram_id
  })

  const response = await fetch(apiUrl, {
    next: { revalidate: 300 }
  })
  
  const result = await response.json()
  const initialProducts = result.data || result

  // Проверяем что данные есть
  if (!initialProducts || !Array.isArray(initialProducts) || initialProducts.length === 0) {
    // Если это фильтр избранного - показываем специальное сообщение
    if (filterParams.filter === 'favorites') {
      return (
        <HomeLayout>
          <FavoritesEmpty />
        </HomeLayout>
      )
    }
    
    // Для остальных случаев - общее сообщение
    return (
      <HomeLayout>
        <div>Нет товаров для отображения</div>
      </HomeLayout>
    )
  }

  return (
    <HomeLayout>
      <InfiniteScrollProducts initialProducts={initialProducts} telegram_id={telegram_id} />
    </HomeLayout>
  )
}
