'use client'

import React, { useState, useMemo } from 'react'
import type { QueryConfig, Category, CreateQueryRequest } from '@/shared/types/queries.interface'
import type { EditingQuery } from '@/shared/types/modal.interface'
import { createQuery, updateQuery, deleteQuery } from '@/utils/api/crud.utils'
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
const truncateText = (text: string | undefined, maxLength: number = 10): string => {
  if (!text || text.length <= maxLength) {
    return text || ''
  }
  return text.substring(0, maxLength) + '...'
}

const groupQueriesByName = (queries: QueryConfig[]): GroupedQuery[] => {
  const grouped = queries.reduce((acc, query) => {
    // Проверяем, что query и query.query существуют
    if (!query || !query.query) {
      console.warn('⚠️ Пропускаем запрос с отсутствующими данными:', query)
      return acc
    }

    const existing = acc.find(group => group.query.toLowerCase() === query.query.toLowerCase())
    if (existing) {
      existing.platforms.push(query)
      // Обновляем дату последнего изменения
      if (query.updatedAt && new Date(query.updatedAt) > new Date(existing.latestUpdated)) {
        existing.latestUpdated = query.updatedAt
      }
    } else {
      acc.push({
        query: query.query,
        platforms: [query],
        latestUpdated: query.updatedAt || query.createdAt || new Date().toISOString()
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
      
      console.log('🔍 Добавление запроса:', queryData)
      
      // Добавляем categoryKey из выбранной категории
      const queryDataWithCategory = {
        ...queryData,
        category: selectedCategoryKey
      }
      
      console.log('🔍 Данные с категорией:', queryDataWithCategory)
      
      const result = await createQuery(queryDataWithCategory)
      console.log('🔍 Результат создания запроса:', result)
      
      if (result.success && result.data) {
        console.log('🔍 Данные созданного запроса:', result.data)
        
        // DB API возвращает массив запросов (для обеих платформ)
        const createdQueries = Array.isArray(result.data) ? result.data : [result.data]
        const newQueries = [...queries, ...createdQueries as QueryConfig[]]
        setQueries(newQueries)
        setIsAdding(false)
        console.log('✅ Запрос успешно добавлен, обновлен список:', newQueries.length, 'запросов')
      } else {
        console.error('❌ Ошибка добавления запроса:', result.error)
        alert(result.error || 'Ошибка добавления запроса')
      }
    } catch (error) {
      console.error('Ошибка добавления запроса:', error)
      alert('Ошибка добавления запроса')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (queryData: CreateQueryRequest) => {
    try {
      setLoading(true)
      
      if (!authToken) {
        throw new Error('Требуется авторизация')
      }
      
      if (!editingQuery) {
        throw new Error('Нет данных для редактирования')
      }
      
      console.log('🔍 Редактирование запроса:', editingQuery.id, queryData)
      
      // Добавляем categoryKey из выбранной категории
      const queryDataWithCategory = {
        ...queryData,
        query: queryData.query, // Используем новое название запроса из формы
        oldQuery: editingQuery.query, // Старое название для поиска записей
        category: selectedCategoryKey,
        categoryKey: selectedCategoryKey // Дублируем для совместимости
      }
      
      console.log('🔍 Данные с категорией:', queryDataWithCategory)
      
      const result = await updateQuery(editingQuery.id.toString(), queryDataWithCategory)
      console.log('🔍 Результат обновления запроса:', result)
      
      if (result.success && result.data) {
        console.log('🔍 Данные обновленных запросов:', result.data)
        
        // DB API возвращает массив обновленных запросов (для обеих платформ)
        const updatedQueriesArray = Array.isArray(result.data) ? result.data : [result.data]
        
        // Обновляем все записи с одинаковым названием запроса
        const updatedQueries = queries.map(q => {
          const updatedQuery = updatedQueriesArray.find(uq => uq.id === q.id)
          return updatedQuery ? { ...q, ...updatedQuery } : q
        })
        
        setQueries(updatedQueries)
        setEditingQuery(null)
        console.log('✅ Все записи запроса успешно обновлены')
      } else {
        console.error('❌ Ошибка обновления запроса:', result.error)
        alert(result.error || 'Ошибка обновления запроса')
      }
    } catch (error) {
      console.error('Ошибка обновления запроса:', error)
      alert('Ошибка обновления запроса')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      
      if (!authToken) {
        throw new Error('Требуется авторизация')
      }
      
      console.log('🔍 Удаление запроса:', id)
      
      // Находим запрос, который нужно удалить, чтобы получить его название
      const queryToDelete = queries.find(q => q.id.toString() === id)
      if (!queryToDelete) {
        throw new Error('Запрос не найден')
      }
      
      console.log('🔍 Удаляем все записи с названием:', queryToDelete.query)
      
      const result = await deleteQuery(id, queryToDelete.query, selectedCategoryKey)
      console.log('🔍 Результат удаления запроса:', result)
      
      if (result.success) {
        console.log('✅ Все записи запроса успешно удалены')
        
        // Удаляем ВСЕ записи с одинаковым названием запроса из списка
        const updatedQueries = queries.filter(q => q.query !== queryToDelete.query)
        setQueries(updatedQueries)
        setDeletingQuery(null)
        console.log('✅ Все записи запроса удалены из списка:', queryToDelete.query)
      } else {
        console.error('❌ Ошибка удаления запроса:', result.error)
        alert(result.error || 'Ошибка удаления запроса')
      }
    } catch (error) {
      console.error('Ошибка удаления запроса:', error)
      alert('Ошибка удаления запроса')
    } finally {
      setLoading(false)
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
                        // Собираем данные из обеих платформ для редактирования
                        const ozonQuery = group.platforms.find(p => p.platform === 'ozon')
                        const wbQuery = group.platforms.find(p => p.platform === 'wb')
                        const firstQuery = group.platforms[0]
                        
                        console.log('🔍 Данные для редактирования:')
                        console.log('🔍 group.platforms:', group.platforms)
                        console.log('🔍 ozonQuery:', ozonQuery)
                        console.log('🔍 wbQuery:', wbQuery)
                        console.log('🔍 firstQuery:', firstQuery)
                        
                        setEditingQuery({
                          id: firstQuery.id,
                          query: firstQuery.query,
                          platform: 'both',
                          // Данные для Ozon (из записи с platform === 'ozon')
                          ozon_platform: ozonQuery?.platform_id || '',
                          ozon_exact: ozonQuery?.exactmodels || '',
                          // Данные для WB (из записи с platform === 'wb')
                          wb_platform: wbQuery?.platform_id || '',
                          wb_exact: wbQuery?.exactmodels || '',
                          // Общие данные
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
          onAddQuery={handleEdit}
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
          isLoading={loading}
          isOpen={!!deletingQuery}
        />
      )}
    </div>
  )
}
