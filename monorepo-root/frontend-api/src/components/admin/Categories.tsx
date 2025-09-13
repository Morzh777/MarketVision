'use client'

import { useState } from 'react'
import type { Category } from '@/shared/types/categories.interface'
import HelpButton from './HelpButton'
import AddModal from './AddModal'
import ConfirmModal from './ConfirmModal'
import { categoryApi } from '@/utils/api/crud.utils'
import { API_ENDPOINTS } from '@/constants/api'
import { EditIcon, DeleteIcon, PlusIcon } from '@/components/ui/Icons'
import '@/app/styles/components/Categories.scss'

interface CategoriesProps {
  categories: Category[]
  authToken: string
}

export default function Categories({ categories, authToken }: CategoriesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddCategory = async (categoryData: { key: string; display: string; ozon_id?: string; wb_id?: string }) => {
    console.log('🚀 handleAddCategory called:', { categoryData, editingCategory, authToken: !!authToken })
    
    if (!authToken) {
      alert('Токен авторизации не найден')
      return
    }

    try {
      let result

      if (editingCategory) {
        // Редактируем существующую категорию
        console.log('✏️ Редактируем категорию:', { categoryData, editingCategory })
        console.log('🆔 editingCategory.id:', editingCategory.id, typeof editingCategory.id)
        const updateData = {
          ...categoryData
          // key приходит из формы и может быть изменен
        }
        console.log('📝 updateData:', updateData)
        result = await categoryApi.update(editingCategory.id.toString(), updateData, authToken)
      } else {
        // Добавляем новую категорию
        console.log('➕ Добавляем категорию:', categoryData)
        result = await categoryApi.create(categoryData, authToken)
      }

      if (result.success) {
        console.log(`✅ Категория успешно ${editingCategory ? 'обновлена' : 'добавлена'}`)
        setEditingCategory(null)
        setIsModalOpen(false)
        window.location.reload() // Reload to show changes
      } else {
        console.error(`❌ Ошибка ${editingCategory ? 'обновления' : 'добавления'} категории:`, result.error)
        alert(result.error || 'Ошибка сервера')
      }
    } catch (error) {
      console.error(`❌ Ошибка при ${editingCategory ? 'обновлении' : 'добавлении'} категории:`, error)
      alert('Ошибка подключения к серверу')
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || !authToken) return

    setIsDeleting(true)

    try {
      console.log('Удаляем категорию:', categoryToDelete.id)

      const result = await categoryApi.delete(categoryToDelete.id.toString(), authToken)

      if (result.success) {
        console.log('✅ Категория успешно удалена')
        // Принудительно обновляем страницу для получения актуальных данных
        window.location.href = window.location.href
      } else {
        console.error('❌ Ошибка удаления категории:', result.error)
        alert(result.error || 'Ошибка сервера')
      }
    } catch (error) {
      console.error('❌ Ошибка при удалении категории:', error)
      alert('Ошибка подключения к серверу')
    } finally {
      setIsDeleting(false)
      setIsConfirmModalOpen(false)
      setCategoryToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false)
    setCategoryToDelete(null)
  }

  return (
    <div className="categories">
      <div className="categories__header">
        <div className="categories__header-actions">
          <button
            className="categories__add-btn"
            onClick={() => {
              setEditingCategory(null)
              setIsModalOpen(true)
            }}
          >
            <PlusIcon size={16} />
            Добавить категорию
          </button>
          <HelpButton type="categories" />
        </div>
      </div>

      <div className="categories__list">
        {Array.from({ length: Math.ceil(categories.length / 2) }, (_, columnIndex) => (
          <div key={columnIndex} className="category-column">
            {categories.slice(columnIndex * 2, columnIndex * 2 + 2).map(category => (
              <div key={category.id} className="category-card">
                <div className="category-card__content">
                  <h3 className="category-card__title">{category.display}</h3>
                  <p className="category-card__subtitle">{category.key}</p>

                  <div className="category-card__ids">
                    {category.ozon_id && (
                      <div className="category-card__id">
                        <span className="category-card__id-label">OZ:</span>
                        <span className="category-card__id-value">{category.ozon_id}</span>
                      </div>
                    )}
                    {category.wb_id && (
                      <div className="category-card__id">
                        <span className="category-card__id-label">WB:</span>
                        <span className="category-card__id-value">{category.wb_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="category-card__actions">
                  <button 
                    className="category-card__edit"
                    onClick={() => handleEditCategory(category)}
                    title="Редактировать"
                  >
                    <EditIcon size={12} />
                  </button>
                  <button 
                    className="category-card__delete"
                    onClick={() => handleDeleteCategory(category)}
                    title="Удалить"
                  >
                    <DeleteIcon size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <AddModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddCategory}
        editingCategory={editingCategory}
        mode="category"
        categories={[]}
        selectedCategoryKey=""
        onAddQuery={() => {}}
        onUpdateQuery={() => {}}
        editingQuery={null}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Подтвердите удаление"
        message={`Вы уверены, что хотите удалить категорию "${categoryToDelete?.display}"?`}
        confirmText="Удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />
    </div>
  )
}