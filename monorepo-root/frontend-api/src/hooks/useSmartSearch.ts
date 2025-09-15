import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSearchVariants, normalizeQuery } from '@/utils/transliteration'
import type { Products } from '@/shared/types/products.interface'

interface SearchResult {
  product: Products
  score: number
  matchType: 'exact' | 'starts' | 'contains' | 'transliterated'
}

export function useSmartSearch(products: Products[]) {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return products
    }

    const searchVariants = createSearchVariants(searchQuery)
    const results: SearchResult[] = []

    products.forEach(product => {
      const productQuery = normalizeQuery(product.query)
      let bestScore = 0
      let bestMatchType: SearchResult['matchType'] = 'contains'

      // Проверяем каждый вариант поиска
      searchVariants.forEach(variant => {
        // Точное совпадение
        if (productQuery === variant) {
          const score = 100
          if (score > bestScore) {
            bestScore = score
            bestMatchType = 'exact'
          }
        }
        // Начинается с запроса
        else if (productQuery.startsWith(variant)) {
          const score = 80 + (variant.length / productQuery.length) * 20
          if (score > bestScore) {
            bestScore = score
            bestMatchType = 'starts'
          }
        }
        // Содержит запрос
        else if (productQuery.includes(variant)) {
          const score = 60 + (variant.length / productQuery.length) * 20
          if (score > bestScore) {
            bestScore = score
            bestMatchType = 'contains'
          }
        }
        // Транслитерация (если это не оригинальный запрос)
        else if (variant !== normalizeQuery(searchQuery)) {
          const score = 40 + (variant.length / productQuery.length) * 20
          if (score > bestScore) {
            bestScore = score
            bestMatchType = 'transliterated'
          }
        }
      })

      // Добавляем результат только если есть совпадение
      if (bestScore > 0) {
        results.push({
          product,
          score: bestScore,
          matchType: bestMatchType
        })
      }
    })

    // Сортируем по релевантности (score) и типу совпадения
    return results
      .sort((a, b) => {
        // Сначала по типу совпадения
        const typeOrder = { exact: 0, starts: 1, contains: 2, transliterated: 3 }
        const typeDiff = typeOrder[a.matchType] - typeOrder[b.matchType]
        
        if (typeDiff !== 0) return typeDiff
        
        // Затем по score
        return b.score - a.score
      })
      .map(result => result.product)
  }, [products, searchQuery])

  return {
    searchResults,
    hasSearchQuery: !!searchQuery.trim(),
    searchQuery
  }
}
