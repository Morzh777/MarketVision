'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
// Хуки удалены - используем только middleware и cookies
import { ArrowLeftIcon, HeartIcon, ShareIcon } from '@/components/ui/Icons'
import { PAGES } from '@/config/pages.config'
interface ProductMenuClientProps {
  query: string
  telegram_id?: string
  initialIsFavorite?: boolean
}

export default function ProductMenuClient({ query, telegram_id, initialIsFavorite = false }: ProductMenuClientProps) {
  const router = useRouter()
  // Используем только переданный telegram_id
  const effectiveTelegramId = telegram_id || '171989'
  
  // Отладка
  console.log('🔍 ProductMenuClient:', {
    telegram_id,
    effectiveTelegramId,
    isAuthenticated: !!effectiveTelegramId
  })
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  
  // Простая проверка аутентификации через telegram_id
  const isAuthenticated = !!effectiveTelegramId

  // Простая функция для работы с избранным
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, cannot toggle favorite')
      return
    }
    
    console.log('🔄 Toggling favorite:', {
      telegram_id: effectiveTelegramId,
      query,
      currentIsFavorite: isFavorite
    })
    
    setIsFavoriteLoading(true)
    try {
      // Используем DELETE для удаления, POST для добавления
      const method = isFavorite ? 'DELETE' : 'POST'
      console.log('🔍 Making favorites request:', { method, telegram_id: effectiveTelegramId, query })
      
      const response = await fetch('/api/auth/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegram_id: effectiveTelegramId, 
          query: query 
        })
      })
      
      console.log('📡 API Response:', {
        method,
        status: response.status,
        ok: response.ok
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Favorite toggled successfully:', result)
        setIsFavorite(!isFavorite)
      } else {
        try {
          const error = await response.json()
          console.error('❌ API Error:', error)
        } catch (parseError) {
          console.error('❌ API Error (could not parse):', response.status, response.statusText)
        }
      }
    } catch (error) {
      console.error('❌ Network Error:', error)
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
        router.push(PAGES.HOME())
    }
  }

  const handleFavoriteToggle = async () => {
    if (!query || !isAuthenticated) {
      return
    }
    
    await toggleFavorite()
  }

  return (
    <div className="productPage__topBar">
      <div className="productPage__topBarLeft">
        <button 
          className="productPage__topBarButton" 
          onClick={handleBack}
          aria-label="Назад"
        >
          <ArrowLeftIcon size={28} />
        </button>
      </div>
      <div className="productPage__topBarRight">
        <button 
          className="productPage__topBarButton" 
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          onClick={handleFavoriteToggle}
          disabled={isFavoriteLoading || !isAuthenticated}
          title={!isAuthenticated ? "Войдите через Telegram для добавления в избранное" : ""}
        >
          <HeartIcon 
            size={26} 
            className={`${isFavorite ? 'heart-filled' : ''} ${isFavoriteLoading ? 'heart-loading' : ''}`}
          />
        </button>
        <button 
          className="productPage__topBarButton" 
          aria-label="Поделиться"
        >
          <ShareIcon size={26} />
        </button>
      </div>
    </div>
  )
}
