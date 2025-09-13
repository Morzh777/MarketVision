'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function HeaderClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentSortBy = searchParams.get('sortBy') as 'price' | 'percent' | null
  const currentSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null

  const toggleSort = (type: 'price' | 'percent') => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (currentSortBy === type) {
      // Переключаем порядок сортировки
      const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'
      params.set('sortOrder', newOrder)
    } else {
      // Устанавливаем новый тип сортировки
      params.set('sortBy', type)
      params.set('sortOrder', 'asc')
    }
    
    router.push(`/?${params.toString()}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => toggleSort('price')}
        className={`header__sort-btn header__sort-btn--price ${currentSortBy === 'price' ? 'header__sort-btn--active' : ''}`}
      >
        Мин. цена
        {currentSortBy === 'price' && currentSortOrder === 'asc' && <span>↑</span>}
        {currentSortBy === 'price' && currentSortOrder === 'desc' && <span>↓</span>}
      </button>
      
      <button
        type="button"
        onClick={() => toggleSort('percent')}
        className={`header__sort-btn header__sort-btn--percent ${currentSortBy === 'percent' ? 'header__sort-btn--active' : ''}`}
      >
        Изм. %
        {currentSortBy === 'percent' && currentSortOrder === 'asc' && <span>↑</span>}
        {currentSortBy === 'percent' && currentSortOrder === 'desc' && <span>↓</span>}
      </button>
    </>
  )
}
