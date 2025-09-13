'use client'

import React, { useState, useMemo } from 'react'
import type { QueryConfig, Category, CreateQueryRequest } from '@/shared/types/queries.interface'
import type { EditingQuery } from '@/shared/types/modal.interface'
import { queryApi } from '@/utils/api/crud.utils'
import AddModal from './AddModal'
import ConfirmModal from './ConfirmModal'
import CustomSelect from '@/components/ui/CustomSelect'
import { EditIcon, DeleteIcon, PlusIcon } from '@/components/ui/Icons'
import '@/app/styles/components/Queries.scss'

// Функция для группировки запросов по названию
interface GroupedQuery {
  query: string
  platforms: QueryConfig[]
  latestUpdated: string
}



// Функция для обрезки длинного текста до 10 символов
const truncateText = (text: string, maxLength: number = 10): string => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

const groupQueriesByName = (queries: QueryConfig[]): GroupedQuery[] => {
  const grouped = queries.reduce((acc, query) => {
    const existing = acc.find(group => group.query.toLowerCase() === query.query.toLowerCase())
    if (existing) {
      existing.platforms.push(query)
      // Обновляем дату последнего изменения
      if (new Date(query.updatedAt) > new Date(existing.latestUpdated)) {
        existing.latestUpdated = query.updatedAt
      }
    } else {
      acc.push({
        query: query.query,
        platforms: [query],
        latestUpdated: query.updatedAt
      })
    }
    return acc
  }, [] as GroupedQuery[])

  // Сортируем по дате последнего изменения (новые сверху)
  return grouped.sort((a, b) => new Date(b.latestUpdated).getTime() - new Date(a.latestUpdated).getTime())
}

interface QueriesClientProps {
  queriesByCategory: Record<string, QueryConfig[]>
  categories: Category[]
  selectedCategoryKey: string
  initialQueries: QueryConfig[]
  authToken: string
}

export default function QueriesClient({ 
  queriesByCategory,
  categories, 
  selectedCategoryKey: initialCategoryKey,
  initialQueries,
  authToken
}: QueriesClientProps) {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(initialCategoryKey)
  const [queries, setQueries] = useState<QueryConfig[]>(initialQueries)
  const [loading, setLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingQuery, setEditingQuery] = useState<EditingQuery | null>(null)
  const [deletingQuery, setDeletingQuery] = useState<QueryConfig | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Обновляем queries при изменении selectedCategoryKey
  React.useEffect(() => {
    const categoryQueries = queriesByCategory[selectedCategoryKey] || []
    setQueries(categoryQueries)
    console.log('🔍 QueriesClient - switching to category:', selectedCategoryKey, 'queries count:', categoryQueries.length)
  }, [selectedCategoryKey, queriesByCategory])

  // Переключаем категорию через URL параметры
  const handleCategoryChange = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey)
    // Обновляем URL без перезагрузки страницы
    const url = new URL(window.location.href)
    url.searchParams.set('category', categoryKey)
    window.history.pushState({}, '', url.toString())
  }

  const groupedQueries = useMemo(() => groupQueriesByName(queries), [queries])

  const handleAdd = async (queryData: CreateQueryRequest) => {
    try {
      setLoading(true)
      
      if (!authToken) {
        throw new Error('Требуется авторизация')
      }
      
      const result = await queryApi.create(queryData, authToken)
      
      if (result && 'data' in result) {
        const newQueries = [...queries, result.data as QueryConfig]
        setQueries(newQueries)
        setIsAdding(false)
      }
    } catch (error) {
      console.error('Ошибка добавления запроса:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true)
      const authToken = localStorage.getItem('authToken')
      if (!authToken) {
        throw new Error('Требуется авторизация')
      }

      await queryApi.delete(id, authToken)
      
      const newQueries = queries.filter(q => q.id.toString() !== id)
      setQueries(newQueries)
      setDeletingQuery(null)
    } catch (error) {
      console.error('Ошибка удаления запроса:', error)
    } finally {
      setIsDeleting(false)
    }
  }



  if (loading) {
    return (
      <div className="queries-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка запросов...</p>
      </div>
    )
  }

  return (
    <div className="queries">
      <div className="queries__header">
        <h2>Управление запросами</h2>
        <div className="queries__controls">
          <CustomSelect
            options={categories.map(category => ({
              value: category.key,
              label: category.display
            }))}
            value={selectedCategoryKey}
            onChange={handleCategoryChange}
            placeholder="Выберите категорию"
            className="queries__categorySelect"
          />
          <button 
            onClick={() => {
              if (selectedCategoryKey) {
                setIsAdding(true)
              } else {
                alert('Сначала выберите категорию')
              }
            }}
            className="queries__addButton"
            disabled={loading}
          >
            Добавить запрос
            <PlusIcon size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="queries__loading">Загрузка...</div>
      ) : (
        <div className="queries__list">
          {groupedQueries.length === 0 ? (
            <div className="queries__empty">
              {selectedCategoryKey ? 'Нет запросов для выбранной категории' : 'Выберите категорию для просмотра запросов'}
            </div>
          ) : (
            <div className="queries__grid">
              {groupedQueries.map((group, index) => (
                <div key={`group-${group.query}-${index}`} className="query-card">
                  <div className="query-card__content">
                    <h3 className="query-card__title" title={group.query}>
                      {truncateText(group.query, 10)}
                    </h3>
                  </div>

                  <div className="query-card__actions">
                    <button 
                      onClick={() => {
                        // Берем первый запрос из группы для редактирования
                        const firstQuery = group.platforms[0]
                        setEditingQuery({
                          id: firstQuery.id,
                          query: firstQuery.query,
                          platform: firstQuery.platform,
                          platform_id: firstQuery.platform_id || '',
                          exactmodels: firstQuery.exactmodels || '',
                          wb_platform_id: firstQuery.wb_platform_id || '',
                          wb_exactmodels: firstQuery.wb_exactmodels || '',
                          recommended_price: firstQuery.recommended_price || 0,
                          categoryKey: selectedCategoryKey,
                          createdAt: firstQuery.createdAt,
                          updatedAt: firstQuery.updatedAt
                        })
                      }}
                      className="query-card__edit"
                      disabled={loading}
                      title="Редактировать"
                    >
                      <EditIcon size={12} />
                    </button>
                    <button 
                      onClick={() => setDeletingQuery(group.platforms[0])}
                      className="query-card__delete"
                      disabled={loading}
                      title="Удалить"
                    >
                      <DeleteIcon size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальные окна */}
      {isAdding && (
        <AddModal
          mode="query"
          categories={categories}
          selectedCategoryKey={selectedCategoryKey}
          onAdd={() => {}}
          onAddQuery={handleAdd}
          onClose={() => setIsAdding(false)}
          isOpen={isAdding}
        />
      )}

      {editingQuery && (
        <AddModal
          mode="query"
          categories={categories}
          selectedCategoryKey={selectedCategoryKey}
          editingQuery={editingQuery}
          onAdd={() => {}}
          onAddQuery={handleAdd}
          onClose={() => setEditingQuery(null)}
          isOpen={!!editingQuery}
        />
      )}

      {deletingQuery && (
        <ConfirmModal
          title="Удаление запроса"
          message={`Вы уверены, что хотите удалить запрос "${deletingQuery.query}" для платформы ${deletingQuery.platform}?`}
          onConfirm={() => handleDelete(deletingQuery.id.toString())}
          onClose={() => setDeletingQuery(null)}
          isLoading={isDeleting}
          isOpen={!!deletingQuery}
        />
      )}
    </div>
  )
}
