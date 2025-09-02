'use client';

import { useCallback, useMemo, useState } from 'react';

import Popup from '../Popup';
import { QuestionIcon } from '../Icons';
import { useConfirmDialog } from './useConfirmDialog';

// Убрали импорт конфига - теперь все данные только из БД



type Category = { 
  id: number; 
  key: string; 
  display: string; 
  ozon_id?: string | null; 
  wb_id?: string | null; 
};

type QueryCfg = {
  id: number;
  query: string;
  platform_id?: string | null;
  exactmodels?: string | null;
  platform: 'ozon' | 'wb';
  createdAt: string;
  updatedAt: string;
};

interface AdminPageProps {
  initialCategories: Category[];
  initialQueries: QueryCfg[];
  initialSelectedKey: string;
}

export default function AdminPage({ 
  initialCategories, 
  initialQueries, 
  initialSelectedKey 
}: AdminPageProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedKey, setSelectedKey] = useState<string>(initialSelectedKey);
  const [queries, setQueries] = useState<QueryCfg[]>(initialQueries);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    query: '', 
    platform_id: '', 
    exactmodels: '', 
    platform: 'both' as 'both' | 'ozon' | 'wb' 
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingQuery, setEditingQuery] = useState<QueryCfg | null>(null);
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());
  const [categoryForm, setCategoryForm] = useState({
    key: '',
    display: '',
    ozon_id: '',
    wb_id: ''
  });

  // Хук для управления диалогом подтверждения
  const { dialogState, showConfirm, handleCancel, handleConfirm } = useConfirmDialog();

  const selectedCategory = useMemo(
    () => categories.find((c) => c.key === selectedKey) || null,
    [categories, selectedKey]
  );

  const reloadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = await res.json();

      setCategories(Array.isArray(data) ? data : []);
      if (!selectedKey && Array.isArray(data) && data.length) {
        setSelectedKey(data[0].key);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  }, [selectedKey]);

  const reloadQueries = async (key: string) => {
    try {
      const res = await fetch(`/api/categories/queries?categoryKey=${encodeURIComponent(key)}`, { 
        cache: 'no-store' 
      });
      const data = await res.json();
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error);
    }
  };

  const handleAddQuery = async () => {
    if (!selectedKey || !form.query.trim()) return;
    
    setLoading(true);
    try {
      // Если редактируем существующий запрос, сначала удаляем старый
      if (editingQuery && editingQuery.query !== form.query.trim()) {
        await fetch(`/api/categories/queries?categoryKey=${encodeURIComponent(selectedKey)}&query=${encodeURIComponent(editingQuery.query)}`, {
          method: 'DELETE',
        });
      }
      
      await fetch('/api/categories/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryKey: selectedKey,
          query: form.query.trim(),
          platform_id: form.platform_id.trim() || null,
          exactmodels: form.exactmodels.trim() || null,
          platform: form.platform,
        }),
      });
      
      setForm({ query: '', platform_id: '', exactmodels: '', platform: 'both' });
      setEditingQuery(null);
      await reloadQueries(selectedKey);
    } catch (error) {
      console.error('Ошибка добавления/редактирования запроса:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuery = (query: QueryCfg) => {
    setEditingQuery(query);
    setForm({
      query: query.query,
      platform_id: query.platform_id || '',
      exactmodels: query.exactmodels || '',
      platform: query.platform || 'both'
    });

  };

  const handleCancelEdit = () => {
    setEditingQuery(null);
    setForm({ query: '', platform_id: '', exactmodels: '', platform: 'both' });

  };

  const handleRemoveQuery = async (queryText: string) => {
    if (!selectedKey) return;
    
    const confirmed = await showConfirm(
      'Удаление запроса',
      `Вы уверены, что хотите удалить запрос "${queryText}"?`,
      'Удалить',
      'Отмена'
    );
    
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    try {
      console.log('Deleting query:', { selectedKey, queryText });
      
      const response = await fetch(`/api/categories/queries/${encodeURIComponent(queryText)}?categoryKey=${encodeURIComponent(selectedKey)}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      if (response.ok) {
        await reloadQueries(selectedKey);
      } else {
        const result = await response.json().catch(() => ({}));
        console.error('Ошибка сервера при удалении:', {
          status: response.status,
          result
        });
        alert(`Ошибка удаления: ${result.error || result.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка удаления запроса:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    console.log('handleAddCategory called with:', categoryForm);
    if (!categoryForm.key.trim() || !categoryForm.display.trim()) {
      console.log('Validation failed: key or display is empty');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Sending POST request to API');
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: categoryForm.key.trim(),
          display: categoryForm.display.trim(),
          ozon_id: categoryForm.ozon_id.trim() || null,
          wb_id: categoryForm.wb_id.trim() || null,
        }),
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      setCategoryForm({ key: '', display: '', ozon_id: '', wb_id: '' });
      setShowAddCategory(false);
      await reloadCategories();
    } catch (error) {
      console.error('Ошибка создания категории:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryKey: string) => {
    const confirmed = await showConfirm(
      'Удаление категории',
      `Вы уверены, что хотите удалить категорию "${categoryKey}"?`,
      'Удалить',
      'Отмена'
    );
    
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    try {
      console.log('Deleting category:', categoryKey);
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryKey)}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      if (response.ok) {
        await reloadCategories();
        // Если удаляемая категория была выбрана, сбрасываем выбор
        if (selectedKey === categoryKey) {
          setSelectedKey('');
        }
      } else {
        const result = await response.json().catch(() => ({}));
        console.error('Ошибка сервера при удалении:', result);
        alert('Ошибка при удалении категории');
      }
    } catch (error) {
      console.error('Ошибка удаления категории:', error);
      alert('Ошибка при удалении категории');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    // Пока просто показываем алерт, можно расширить функциональность
    alert(`Редактирование категории "${category.display}" (key: ${category.key})`);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryFormChange = (field: string, value: string) => {
    setCategoryForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleQueryExpansion = (queryName: string) => {
    setExpandedQueries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(queryName)) {
        newSet.delete(queryName);
      } else {
        newSet.add(queryName);
      }
      return newSet;
    });
  };

  const handleStartParsing = async () => {
    if (!selectedKey) {
      alert('Выберите категорию для парсинга');
      return;
    }

    setLoading(true);
    try {
      console.log('Запуск парсинга для категории:', selectedKey);
      
      const response = await fetch('/api/parsing/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryKey: selectedKey }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Парсинг запущен успешно!\nОбработано запросов: ${result.data?.queries_processed || 0}\nНайдено товаров: ${result.data?.total_products_found || 0}`);
      } else {
        alert(`Ошибка при запуске парсинга: ${result.message}`);
      }
    } catch (error) {
      console.error('Ошибка при запуске парсинга:', error);
      alert('Ошибка при запуске парсинга');
    } finally {
      setLoading(false);
    }
  };



  // Убрали автоматические настройки из конфига - теперь все только из БД

  return (
    <div className="adminPage">
      <div className="header">
        <h1 className="header__title">Админ-панель</h1>
        <p className="header__subtitle">Управление категориями и запросами</p>
      </div>

      <div className="grid">
        {/* Левая колонка - Категории */}
        <div className="section">
          <div className="section__header">
            <div className="section__headerTop">
              <div>
                <h2 className="section__headerTitle">Категории</h2>
                <p className="section__headerSubtitle">
                  Выберите категорию для управления запросами
                </p>
              </div>
              <div className="section__helpIcon">
                <QuestionIcon size={16} />
                <div className="section__tooltip">
                  Ключ категории должен быть уникальным идентификатором (например: videocards, processors). Название категории - это отображаемое имя для пользователей. OZ ID и WB ID - это идентификаторы категорий на соответствующих платформах.
                </div>
              </div>
            </div>
          </div>

          {showAddCategory && (
            <div className="form">
              <h3 className="form__title">Создать новую категорию</h3>

              <div className="form__fields">
                <div className="form__fieldRow">
                  <div className="form__fieldGroup">
                    <input
                      className="form__fieldInput"
                      placeholder="Ключ категории (например: videocards)"
                      value={categoryForm.key}
                      onChange={(e) => handleCategoryFormChange('key', e.target.value)}
                    />
                  </div>

                  <div className="form__fieldGroup">
                    <input
                      className="form__fieldInput"
                      placeholder="Отображаемое название (например: Видеокарты)"
                      value={categoryForm.display}
                      onChange={(e) => handleCategoryFormChange('display', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form__fieldRow">
                  <div className="form__fieldGroup">
                    <input
                      className="form__fieldInput"
                      placeholder="Ozon ID (опционально)"
                      value={categoryForm.ozon_id}
                      onChange={(e) => handleCategoryFormChange('ozon_id', e.target.value)}
                    />
                  </div>

                  <div className="form__fieldGroup">
                    <input
                      className="form__fieldInput"
                      placeholder="WB ID (опционально)"
                      value={categoryForm.wb_id}
                      onChange={(e) => handleCategoryFormChange('wb_id', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                className="form__button"
                disabled={loading || !categoryForm.key.trim() || !categoryForm.display.trim()}
                onClick={handleAddCategory}
              >
                {loading ? 'Создание...' : 'Создать категорию'}
              </button>
            </div>
          )}

          <div className="categoriesList">
            {categories.map((category) => {
              console.log('Category data:', category);
              return (
              <div
                key={category.id}
                className={`categoryItem ${
                  selectedKey === category.key ? 'categoryItem--active' : ''
                }`}
              >
                <div 
                  className="categoryItem__content"
                  onClick={() => setSelectedKey(category.key)}
                >
                  <div className="categoryItem__name">{category.display}</div>
                  <div className="categoryItem__key">{category.key}</div>
                </div>
                <div className="categoryItem__ids">
                  <span className="categoryItem__id">OZ: {category.ozon_id || '-'}</span>
                  <span className="categoryItem__id">WB: {category.wb_id || '-'}</span>
                </div>
                <div className="categoryItem__actions">
                  <button
                    className="categoryItem__editButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                    disabled={loading}
                    title="Редактировать категорию"
                  >
                    Редактировать
                  </button>
                  <button
                    className="categoryItem__deleteButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.key);
                    }}
                    disabled={loading}
                    title="Удалить категорию"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          
          <button
            className="section__addButton"
            onClick={() => setShowAddCategory(!showAddCategory)}
            style={{ marginTop: '16px' }}
          >
            {showAddCategory ? 'Отмена' : 'Добавить категорию'}
          </button>
        </div>

        {/* Правая колонка - Запросы */}
        <div className="section">
          <div className="section__header">
            <div className="section__headerTop">
              <div>
                <h2 className="section__headerTitle">Запросы для категории</h2>
                <p className="section__headerSubtitle">
                  Управление поисковыми запросами
                </p>
              </div>
              <div className="section__helpIcon">
                <QuestionIcon size={16} />
                <div className="section__tooltip">
                  Введите поисковый запрос и настройте параметры для парсинга. Platform ID и Exact Models настраиваются вручную для каждого запроса. По умолчанию создаются записи для обеих платформ (Ozon и WB).
                </div>
              </div>
            </div>
          </div>

          <div className="form">
            <div className="form__currentCategory">
              <strong>Текущая категория:</strong> {selectedCategory ? selectedCategory.display : 'Не выбрана'}
            </div>

            {editingQuery && (
              <div className="form__editMode">
                <div className="form__editModeTitle">
                  Редактирование запроса: &quot;{editingQuery.query}&quot;
                </div>
                <button
                  type="button"
                  className="form__cancelButton"
                  onClick={handleCancelEdit}
                >
                  Отмена
                </button>
              </div>
            )}

            <div className="form__fields">
              {/* Строка с вводом запроса */}
              <div className="form__fieldRow">
                <div className="form__fieldGroup">
                  <input
                    className="form__fieldInput"
                    placeholder="Введите поисковый запрос"
                    value={form.query}
                    onChange={(e) => handleFormChange('query', e.target.value)}
                  />
                </div>
              </div>

              {/* Строка с дополнительными настройками */}
              <div className="form__fieldRow">
                <div className="form__fieldGroup">
                  <input
                    className="form__fieldInput"
                    placeholder="Platform ID (Ozon) - опционально"
                    value={form.platform_id}
                    onChange={(e) => handleFormChange('platform_id', e.target.value)}
                  />
                </div>

                <div className="form__fieldGroup">
                  <input
                    className="form__fieldInput"
                    placeholder="Exact Models (Ozon) - опционально"
                    value={form.exactmodels}
                    onChange={(e) => handleFormChange('exactmodels', e.target.value)}
                  />
                </div>
              </div>

              {/* Строка с выбором платформы */}
              <div className="form__fieldRow">
                <div className="form__fieldGroup">
                  <select
                    id="platform-select"
                    name="platform"
                    className="form__fieldSelect"
                    value={form.platform}
                    onChange={(e) => handleFormChange('platform', e.target.value as 'ozon' | 'wb' | 'both')}
                  >
                    <option value="both">Ozon + WB</option>
                    <option value="ozon">Только Ozon</option>
                    <option value="wb">Только WB</option>
                  </select>
                </div>
              </div>
            </div>





            <div className="form__buttons">
              <button
                className="form__button"
                disabled={loading || !selectedKey || !form.query.trim()}
                onClick={handleAddQuery}
              >
                {loading 
                  ? (editingQuery ? 'Сохранение...' : 'Добавление...') 
                  : (editingQuery ? 'Сохранить изменения' : 'Добавить запрос')
                }
              </button>
              
              <button
                className="form__button form__button--secondary"
                disabled={loading || !selectedKey}
                onClick={handleStartParsing}
              >
                {loading ? 'Запуск...' : 'Начать парсинг'}
              </button>
            </div>
          </div>

          <div>
            <h3 className="form__title">Существующие запросы ({queries.length})</h3>
            
            <div className="queriesList">
              {queries.length > 0 ? (
              // Группируем запросы по названию
              Object.entries(
                queries.reduce((acc, query) => {
                  if (!acc[query.query]) {
                    acc[query.query] = [];
                  }
                  acc[query.query].push(query);
                  return acc;
                }, {} as Record<string, QueryCfg[]>)
              ).map(([queryName, queryGroup]) => {
                const isExpanded = expandedQueries.has(queryName);
                return (
                  <div key={queryName} className="queryGroup">
                    <div className="queryGroup__header">
                      <div 
                        className="queryGroup__name queryGroup__name--clickable"
                        onClick={() => toggleQueryExpansion(queryName)}
                      >
                        <span className={`queryGroup__arrow ${isExpanded ? 'queryGroup__arrow--expanded' : ''}`}>
                          ▶
                        </span>
                        {queryName}
                      </div>
                      <div className="queryGroup__actions">
                        <button
                          className="queryItem__editButton"
                          disabled={loading}
                          onClick={() => handleEditQuery(queryGroup[0])}
                        >
                          Редактировать
                        </button>
                        <button
                          className="queryItem__button"
                          disabled={loading}
                          onClick={() => handleRemoveQuery(queryName)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="queryGroup__platforms">
                        {queryGroup.map((query) => (
                          <div key={query.id} className="queryPlatform">
                            <div className="queryPlatform__name">
                              <span className={`platform-icon platform-icon--${query.platform}`}></span>
                              {query.platform === 'ozon' ? 'Ozon' : 'WB'}
                            </div>
                            <div className="queryPlatform__details">
                              <div className="queryPlatform__detail">
                                platform_id: {query.platform_id || '-'}
                              </div>
                              <div className="queryPlatform__detail">
                                exactmodels: {query.exactmodels || '-'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="emptyState">
                {selectedKey ? 'Нет запросов для этой категории' : 'Выберите категорию'}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Кастомный диалог подтверждения */}
      <Popup
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
