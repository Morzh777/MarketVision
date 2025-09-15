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
    // Поиск отключен - не обрабатываем ввод
    // const value = e.target.value
    // setSearchQuery(value)
  }, [])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Поиск отключен - не обрабатываем нажатия
    // if (e.key === 'Enter') {
    //   const params = new URLSearchParams(searchParams.toString())
    //   
    //   if (searchQuery.trim()) {
    //     params.set('search', searchQuery.trim())
    //   } else {
    //     params.delete('search')
    //   }
    //   
    //   router.push(`/?${params.toString()}`)
    // }
  }, [searchQuery, searchParams, router])

  const handleFocus = useCallback(() => {
    // Поиск отключен - не обрабатываем фокус
    // setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    // Поиск отключен - не обрабатываем блюр
    // setIsFocused(false)
  }, [])

  return (
    <div className="search">
      <div className={`search__input-wrapper ${isFocused ? 'search__input-wrapper--focused' : ''}`}>
        <input
          type="text"
          className="search__input search__input--disabled"
          placeholder="В разработке"
          value=""
          disabled
          readOnly
        />
        <SearchIcon className="search__icon" />
      </div>
    </div>
  )
}
