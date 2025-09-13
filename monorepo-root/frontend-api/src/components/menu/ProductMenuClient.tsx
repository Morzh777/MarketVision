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
      console.log('🔍 Making favorites request:', { 
        action: isFavorite ? 'remove' : 'add', 
        endpoint: isFavorite ? '/api/auth/favorites/remove' : '/api/auth/favorites/add',
        telegram_id: effectiveTelegramId, 
        query 
      })
      
      // Используем правильные роуты для добавления/удаления из избранного
      const endpoint = isFavorite ? '/api/auth/favorites/remove' : '/api/auth/favorites/add'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegram_id: effectiveTelegramId, 
          query: query 
        })
      })
      
      console.log('📡 API Response:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Favorite toggled successfully:', result)
        setIsFavorite(!isFavorite)
      } else {
        try {
          const responseText = await response.text()
          console.error('❌ API Error Response Text:', responseText)
          
          if (responseText) {
            const error = JSON.parse(responseText)
            console.error('❌ API Error:', error)
          } else {
            console.error('❌ API Error: Empty response body')
          }
        } catch (parseError) {
          console.error('❌ API Error (could not parse):', response.status, response.statusText, parseError)
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
