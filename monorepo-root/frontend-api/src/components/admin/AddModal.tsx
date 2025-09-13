'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type CategoryFormData } from '@/shared/schemas/category.schema'
import { querySchema, type QueryFormData as QuerySchemaData } from '@/shared/schemas/query.schema'
import type { AddModalProps } from '@/shared/types/modal.interface'
import '@/app/styles/components/Modal.scss'



export default function AddModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  editingCategory,
  mode = 'category',
  categories = [],
  selectedCategoryKey = '',
  onAddQuery,
  onUpdateQuery,
  editingQuery
}: AddModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Форма для категорий
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      key: '',
      display: '',
      ozon_id: '',
      wb_id: ''
    }
  })

  // Форма для запросов
  const queryForm = useForm<QuerySchemaData>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query: '',
      platform: 'both',
      platform_id: '',
      exactmodels: '',
      wb_platform_id: '',
      wb_exactmodels: '',
      recommended_price: '',
      categoryKey: selectedCategoryKey
    }
  })

  useEffect(() => {
    if (!isOpen) {
      // Reset forms when modal closes
      categoryForm.reset()
      queryForm.reset({
        query: '',
        platform: 'both',
        platform_id: '',
        exactmodels: '',
        wb_platform_id: '',
        wb_exactmodels: '',
        recommended_price: '',
        categoryKey: selectedCategoryKey
      })
    } else if (mode === 'category') {
      if (editingCategory) {
        // Fill form with editing category data
        categoryForm.reset({
          key: editingCategory.key,
          display: editingCategory.display,
          ozon_id: editingCategory.ozon_id || '',
          wb_id: editingCategory.wb_id || ''
        })
      } else {
        // Reset category form for new category
        categoryForm.reset({
          key: '',
          display: '',
          ozon_id: '',
          wb_id: ''
        })
      }
    } else if (mode === 'query') {
      if (editingQuery) {
        // Fill form with editing query data
        queryForm.reset({
          query: editingQuery.query,
          platform: 'both', // Всегда обе платформы
          platform_id: editingQuery.platform_id || '',
          exactmodels: editingQuery.exactmodels || '',
          wb_platform_id: editingQuery.wb_platform_id || '',
          wb_exactmodels: editingQuery.wb_exactmodels || '',
          recommended_price: editingQuery.recommended_price?.toString() || '',
          categoryKey: selectedCategoryKey
        })
      } else {
        // Reset query form for new query
        queryForm.reset({
          query: '',
          platform: 'both',
          platform_id: '',
          exactmodels: '',
          wb_platform_id: '',
          wb_exactmodels: '',
          recommended_price: '',
          categoryKey: selectedCategoryKey
        })
      }
    }
  }, [isOpen, editingCategory, editingQuery, mode, selectedCategoryKey, categoryForm, queryForm])

  const handleCategorySubmit = categoryForm.handleSubmit(async (data: CategoryFormData) => {
    setIsLoading(true)
    
    try {
      await onAdd({
        key: data.key,
        display: data.display,
        ozon_id: data.ozon_id || undefined,
        wb_id: data.wb_id || undefined
      })

      onClose()
    } finally {
      setIsLoading(false)
    }
  })

  const handleQuerySubmit = queryForm.handleSubmit(async (data: QuerySchemaData) => {
    setIsLoading(true)
    
    try {
      const queryData = {
        query: data.query.trim(),
        platform: data.platform,
        platform_id: data.platform_id?.trim() || undefined,
        exactmodels: data.exactmodels?.trim() || undefined,
        wb_platform_id: data.wb_platform_id?.trim() || undefined,
        wb_exactmodels: data.wb_exactmodels?.trim() || undefined,
        recommended_price: data.recommended_price ? Number(data.recommended_price) : undefined,
        categoryKey: data.categoryKey
      }

      if (editingQuery && onUpdateQuery) {
        console.log('🔍 AddModal: Вызываем onUpdateQuery с данными:', {
          id: editingQuery.id,
          ...queryData,
          isGroup: editingQuery.isGroup,
          groupIds: editingQuery.groupIds
        })
        
        await onUpdateQuery({
          id: editingQuery.id,
          ...queryData,
          // Передаем информацию о группе запросов
          isGroup: editingQuery.isGroup,
          groupIds: editingQuery.groupIds
        })
      } else if (onAddQuery) {
        console.log('🔍 AddModal: Вызываем onAddQuery с данными:', queryData)
        await onAddQuery(queryData)
      }
      
      onClose()
    } finally {
      setIsLoading(false)
    }
  })


  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {mode === 'category' 
              ? (editingCategory ? 'Редактировать категорию' : 'Добавить категорию')
              : (editingQuery ? 'Редактировать запрос' : 'Добавить запрос')
            }
          </h2>
          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal__content">
          <form className="modal__form" onSubmit={mode === 'category' ? handleCategorySubmit : handleQuerySubmit}>
          {mode === 'category' ? (
            <>
              <div className="modal__field">
                <label className="modal__label">
                  Ключ *
                  <input
                    {...categoryForm.register('key')}
                    type="text"
                    className={`modal__input ${categoryForm.formState.errors.key ? 'modal__input--error' : ''}`}
                    placeholder="videocards"
                  />
                  {categoryForm.formState.errors.key && (
                    <span className="modal__error">{categoryForm.formState.errors.key.message}</span>
                  )}
                </label>
              </div>

              <div className="modal__field">
                <label className="modal__label">
                  Название *
                  <input
                    {...categoryForm.register('display')}
                    type="text"
                    className={`modal__input ${categoryForm.formState.errors.display ? 'modal__input--error' : ''}`}
                    placeholder="Видеокарты"
                  />
                  {categoryForm.formState.errors.display && (
                    <span className="modal__error">{categoryForm.formState.errors.display.message}</span>
                  )}
                </label>
              </div>

              <div className="modal__field">
                <label className="modal__label">
                  OZ ID
                  <input
                    {...categoryForm.register('ozon_id')}
                    type="text"
                    className={`modal__input ${categoryForm.formState.errors.ozon_id ? 'modal__input--error' : ''}`}
                    placeholder="videokarty-15721"
                  />
                  {categoryForm.formState.errors.ozon_id && (
                    <span className="modal__error">{categoryForm.formState.errors.ozon_id.message}</span>
                  )}
                </label>
              </div>

              <div className="modal__field">
                <label className="modal__label">
                  WB ID
                  <input
                    {...categoryForm.register('wb_id')}
                    type="text"
                    className={`modal__input ${categoryForm.formState.errors.wb_id ? 'modal__input--error' : ''}`}
                    placeholder="3274"
                  />
                  {categoryForm.formState.errors.wb_id && (
                    <span className="modal__error">{categoryForm.formState.errors.wb_id.message}</span>
                  )}
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="modal__field">
                <label className="modal__label">
                  Запрос *
                  <input
                    {...queryForm.register('query')}
                    type="text"
                    className={`modal__input ${queryForm.formState.errors.query ? 'modal__input--error' : ''}`}
                    placeholder="iphone 15 pro max"
                  />
                  {queryForm.formState.errors.query && (
                    <span className="modal__error">{queryForm.formState.errors.query.message}</span>
                  )}
                </label>
              </div>

              {/* Платформа всегда 'both' - убираем выбор */}

              <div className="modal__field">
                <label className="modal__label">
                  Ozon Platform ID
                  <input
                    {...queryForm.register('platform_id')}
                    type="text"
                    className={`modal__input ${queryForm.formState.errors.platform_id ? 'modal__input--error' : ''}`}
                    placeholder=""
                  />
                  {queryForm.formState.errors.platform_id && (
                    <span className="modal__error">{queryForm.formState.errors.platform_id.message}</span>
                  )}
                </label>
              </div>

              <div className="modal__field">
                <label className="modal__label">
                  Ozon Exact Models
                  <input
                    {...queryForm.register('exactmodels')}
                    type="text"
                    className="modal__input"
                    placeholder=""
                  />
                </label>
              </div>

              <div className="modal__field">
                <label className="modal__label">
                  WB Platform ID
                  <input
                    {...queryForm.register('wb_platform_id')}
                    type="text"
                    className={`modal__input ${queryForm.formState.errors.wb_platform_id ? 'modal__input--error' : ''}`}
                    placeholder=""
                  />
                  {queryForm.formState.errors.wb_platform_id && (
                    <span className="modal__error">{queryForm.formState.errors.wb_platform_id.message}</span>
                  )}
                </label>
              </div>

              <div className="modal__field">
                <label className="modal__label">
                  WB Exact Models
                  <input
                    {...queryForm.register('wb_exactmodels')}
                    type="text"
                    className="modal__input"
                    placeholder=""
                  />
                </label>
              </div>

              <div className="modal__field">
                <label className="modal__label">
                  Рекомендуемая цена (₽)
                  <input
                    {...queryForm.register('recommended_price')}
                    type="number"
                    className={`modal__input ${queryForm.formState.errors.recommended_price ? 'modal__input--error' : ''}`}
                    placeholder=""
                    min="0"
                    step="1"
                  />
                  {queryForm.formState.errors.recommended_price && (
                    <span className="modal__error">{queryForm.formState.errors.recommended_price.message}</span>
                  )}
                </label>
              </div>

              {/* Поле выбора категории показываем всегда при добавлении нового запроса */}
              {!editingQuery && (
                <div className="modal__field">
                  <label className="modal__label">
                    Категория
                    <select
                      {...queryForm.register('categoryKey')}
                      className="modal__input"
                      disabled={!!selectedCategoryKey}
                    >
                      {categories.map(category => (
                        <option key={category.key} value={category.key}>
                          {category.display}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Показываем даты только при редактировании запроса */}
              {editingQuery && (
                <div className="modal__dates">
                  <div className="modal__date">
                    <div className="modal__date-label">Создан</div>
                    <div className="modal__date-value">
                      {new Date(editingQuery.createdAt).toLocaleString('ru-RU', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="modal__date">
                    <div className="modal__date-label">Обновлен</div>
                    <div className="modal__date-value">
                      {new Date(editingQuery.updatedAt).toLocaleString('ru-RU', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="modal__actions">
            <button 
              type="button" 
              className="modal__cancel" 
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="modal__submit"
              disabled={isLoading}
            >
              {isLoading 
                ? (mode === 'category' 
                    ? (editingCategory ? 'Сохранение...' : 'Добавление...')
                    : (editingQuery ? 'Сохранение...' : 'Добавление...')
                  )
                : (mode === 'category'
                    ? (editingCategory ? 'Сохранить' : 'Добавить')
                    : (editingQuery ? 'Сохранить' : 'Добавить')
                  )
              }
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
