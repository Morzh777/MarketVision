'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchIcon } from '@/components/ui/Icons'
import '@/app/styles/components/Search.scss'

export default function Search() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Синхронизируем с URL параметрами
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearchQuery(urlSearch)
  }, [searchParams])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams.toString())
      
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      } else {
        params.delete('search')
      }
      
      router.push(`/?${params.toString()}`)
    }
  }, [searchQuery, searchParams, router])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  return (
    <div className="search">
      <div className={`search__input-wrapper ${isFocused ? 'search__input-wrapper--focused' : ''}`}>
        <input
          type="text"
          className="search__input"
          placeholder={isFocused ? "" : "Умный поиск"}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <SearchIcon className="search__icon" />
      </div>
    </div>
  )
}
