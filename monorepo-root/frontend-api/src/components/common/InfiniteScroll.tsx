'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

interface InfiniteScrollProps<T> {
  initialData: T[]
  loadMore: (offset: number, limit: number) => Promise<T[] | { data: T[]; hasMore: boolean }>
  limit: number
  children: (data: T[], loading: boolean, hasMore: boolean) => ReactNode
  className?: string
  loadingText?: string
  endText?: string
  deduplicateKey?: keyof T
  scrollThreshold?: number
}

export function InfiniteScroll<T>({
  initialData,
  loadMore,
  limit,
  children,
  className = '',
  loadingText = 'Загрузка...',
  endText = 'Все данные загружены',
  deduplicateKey,
  scrollThreshold = 200
}: InfiniteScrollProps<T>) {
  const [data, setData] = useState<T[]>(Array.isArray(initialData) ? initialData : [])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState<number>(Array.isArray(initialData) ? initialData.length : 0)

  // Обновляем данные при изменении initialData
  useEffect(() => {
    if (Array.isArray(initialData)) {
      setData(initialData)
      setOffset(initialData.length)
      setHasMore(true)
    }
  }, [initialData])

  const loadMoreData = useCallback(async () => {
    if (loading || !hasMore) {
      console.log('InfiniteScroll: Skipping load - loading:', loading, 'hasMore:', hasMore)
      return
    }

    console.log('InfiniteScroll: Loading more data, offset:', offset, 'limit:', limit)
    setLoading(true)
    try {
      const currentOffset = offset
      const response = await loadMore(currentOffset, limit)
      
      // Проверяем формат ответа
      let newData: T[]
      let responseHasMore: boolean | undefined
      
      if (Array.isArray(response)) {
        newData = response
        responseHasMore = undefined
      } else if (response && typeof response === 'object' && 'data' in response) {
        newData = response.data
        responseHasMore = response.hasMore
      } else {
        throw new Error('Invalid response format from loadMore')
      }
      
      console.log('InfiniteScroll: Received data:', newData.length, 'items, hasMore:', responseHasMore)
      
      if (newData.length === 0) {
        console.log('InfiniteScroll: No more data, stopping pagination')
        setHasMore(false)
      } else {
        setData(prev => {
          if (!Array.isArray(prev)) {
            console.error('Previous data is not an array:', prev)
            prev = []
          }
          if (deduplicateKey) {
            // Дедуплицируем по указанному ключу
            const existingKeys = new Set(prev.map(item => item[deduplicateKey]))
            const uniqueNewData = newData.filter(item => !existingKeys.has(item[deduplicateKey]))
            return [...prev, ...uniqueNewData]
          }
          return [...prev, ...newData]
        })
        setOffset(prev => prev + limit)
        
        // Если API вернул информацию о hasMore, используем её
        if (typeof responseHasMore === 'boolean') {
          setHasMore(responseHasMore)
          console.log('InfiniteScroll: API reported hasMore:', responseHasMore)
        } else {
          console.log('InfiniteScroll: Updated offset to:', offset + limit)
        }
      }
    } catch (error) {
      console.error('InfiniteScroll: Error loading more data:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, offset, loadMore, limit, deduplicateKey])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleScroll = () => {
      // Дебаунсинг для предотвращения множественных вызовов
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        const scrollTop = document.documentElement.scrollTop
        const scrollHeight = document.documentElement.scrollHeight
        const clientHeight = window.innerHeight
        
        if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
          console.log('InfiniteScroll: Scroll threshold reached, triggering load')
          loadMoreData()
        }
      }, 100) // 100ms дебаунсинг
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [loadMoreData, scrollThreshold])

  return (
    <div className={className}>
      {children(data, loading, hasMore)}
      {loading && (
        <div className="text-center py-4 text-gray-500">
          {loadingText}
        </div>
      )}
      {!hasMore && data.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          {endText}
        </div>
      )}
    </div>
  )
}
