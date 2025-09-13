'use client'

import { useCallback } from 'react'
import type { Products } from '@/shared/types/products.interface'
import ProductsComponent from '@/app/(public)/(home)/Products'
import { API_ENDPOINTS, PAGINATION } from '@/constants/api'
import { InfiniteScroll } from '@/components/common/InfiniteScroll'
import { useProductFilters } from '@/hooks/useProductFilters'

interface Props {
  initialProducts: Products[]
  className?: string
  telegram_id?: string
}

export function InfiniteScrollProducts({ initialProducts, className = '', telegram_id }: Props) {
  const { buildApiUrl } = useProductFilters()
  
  const loadMoreProducts = useCallback(async (offset: number, limit: number): Promise<Products[] | { data: Products[]; hasMore: boolean }> => {
    const url = buildApiUrl(API_ENDPOINTS.POPULAR_QUERIES, limit, offset)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // Если API возвращает объект с data и hasMore, передаем его как есть
    if (result.data && typeof result.hasMore === 'boolean') {
      console.log('API returned new format:', { hasMore: result.hasMore, dataLength: result.data.length })
      return result
    }
    
    // Иначе используем старый формат (массив)
    return result
  }, [buildApiUrl])

  return (
    <InfiniteScroll
      initialData={initialProducts}
      loadMore={loadMoreProducts}
      limit={PAGINATION.LOAD_MORE_LIMIT}
      deduplicateKey="query"
      className={className}
      loadingText="Загрузка продуктов..."
      endText="Все продукты загружены"
    >
      {(products) => {
        return <ProductsComponent products={products} telegram_id={telegram_id} />
      }}
    </InfiniteScroll>
  )
}
