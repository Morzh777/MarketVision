'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Auth from '../Auth';
import { QuestionIcon } from '../Icons';
import LoadingSpinner from '../LoadingSpinner';
import Popup from '../Popup';

import { useConfirmDialog } from './useConfirmDialog';





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
  wb_platform_id?: string | null;
  wb_exactmodels?: string | null;
  platform: 'ozon' | 'wb';
  recommended_price?: number | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [showParsingPopup, setShowParsingPopup] = useState(false);
  const [parsingResult, setParsingResult] = useState<{ success: boolean; message: string; data?: unknown } | null>(null);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingStage, setParsingStage] = useState<'starting' | 'parsing' | 'completing'>('starting');
  
  // Функция авторизации
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:80/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success && data.user.role === 'admin') {
        // Используем id пользователя как токен
        const token = data.user.id;
        
        // Сохраняем токен и пользователя в localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      return false;
    }
  };

  // Функция выхода
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('http://localhost:80/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Ошибка выхода:', error);
    } finally {
      // Очищаем localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const [form, setForm] = useState({
    query: '', 
    platform_id: '', 
    exactmodels: '', 
    wb_platform_id: '',
    wb_exactmodels: '',
    platform: 'both' as 'both' | 'ozon' | 'wb',
    recommended_price: ''
  });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingQuery, setEditingQuery] = useState<QueryCfg | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set());
  const [categoryForm, setCategoryForm] = useState({
    key: '',
    display: '',
    ozon_id: '',
    wb_id: ''
  });

  // Хук для управления диалогом подтверждения
  const { dialogState, showConfirm, handleCancel, handleConfirm } = useConfirmDialog();

  const reloadQueries = useCallback(async (key: string) => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      
      const res = await fetch(`/api/categories/queries?categoryKey=${encodeURIComponent(key)}`, { 
        cache: 'no-store',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const data = await res.json();
      setQueries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error);
    }
  }, []);

  const reloadCategories = useCallback(async () => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      
      const res = await fetch('/api/categories', { 
        cache: 'no-store',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const data = await res.json();

      setCategories(Array.isArray(data) ? data : []);
      if (!selectedKey && Array.isArray(data) && data.length) {
        setSelectedKey(data[0].key);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  }, [selectedKey]);

  // Проверка авторизации при монтировании компонента
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          // Проверяем токен на сервере для безопасности
          const response = await fetch('http://localhost:80/api/admin/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          const data = await response.json();
          
          if (response.ok && data.success && data.user && data.user.role === 'admin') {
            console.log('Авторизация успешна, пользователь:', data.user);
            setIsAuthenticated(true);
            setCurrentUser(data.user);
          } else {
            // Токен недействителен, очищаем localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        } catch (error) {
          console.error('Ошибка проверки авторизации:', error);
          // Очищаем localStorage при ошибке
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Загружаем запросы при смене категории
  useEffect(() => {
    if (selectedKey && isAuthenticated) {
      reloadQueries(selectedKey);
    }
  }, [selectedKey, isAuthenticated, reloadQueries]);

  // Сбрасываем форму редактирования при смене категории
  useEffect(() => {
    if (editingQuery) {
      setEditingQuery(null);
      setForm({ query: '', platform_id: '', exactmodels: '', wb_platform_id: '', wb_exactmodels: '', platform: 'both', recommended_price: '' });
    }
  }, [selectedKey]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.key === selectedKey) || null,
    [categories, selectedKey]
  );

  const handleAddQuery = async () => {
    if (!selectedKey || !form.query.trim()) return;
    
    setLoading(true);
    try {
      // Если редактируем существующий запрос
      if (editingQuery) {
        // Сначала удаляем старые записи для этого запроса
        const token = localStorage.getItem('auth_token');
        await fetch('/api/categories/queries', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            categoryKey: selectedKey,
            query: editingQuery.query,
          }),
        });
        
        // Затем создаем новые записи с обновленными данными
        // Создаем записи для обеих платформ, если есть соответствующие данные
        const queriesToCreate = [];
        
        // Ozon запрос - ВСЕГДА создаем
        queriesToCreate.push({
          categoryKey: selectedKey,
          query: form.query.trim(),
          platform_id: form.platform_id.trim() || null,
          exactmodels: form.exactmodels.trim() || null,
          platform: 'ozon',
          recommended_price: form.recommended_price ? parseInt(form.recommended_price) : null,
        });
        
        // WB запрос - ВСЕГДА создаем
        queriesToCreate.push({
          categoryKey: selectedKey,
          query: form.query.trim(),
          platform_id: form.wb_platform_id.trim() || null,
          exactmodels: form.wb_exactmodels.trim() || null,
          platform: 'wb',
          recommended_price: form.recommended_price ? parseInt(form.recommended_price) : null,
        });
        
        
        // Создаем все запросы
        for (const queryData of queriesToCreate) {
          await fetch('/api/categories/queries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryData),
          });
        }
        
        setForm({ query: '', platform_id: '', exactmodels: '', wb_platform_id: '', wb_exactmodels: '', platform: 'both', recommended_price: '' });
        setEditingQuery(null);
        await reloadQueries(selectedKey);
        return;
      }
      
      // Создаем новый запрос - ВСЕГДА добавляем для обеих платформ
      const queriesToCreate = [];
      
      // Ozon запрос - ВСЕГДА добавляем
      queriesToCreate.push({
        categoryKey: selectedKey,
        query: form.query.trim(),
        platform_id: form.platform_id.trim() || null,
        exactmodels: form.exactmodels.trim() || null,
        platform: 'ozon',
        recommended_price: form.recommended_price ? parseInt(form.recommended_price) : null,
      });
      
      // WB запрос - ВСЕГДА добавляем
      queriesToCreate.push({
        categoryKey: selectedKey,
        query: form.query.trim(),
        platform_id: form.wb_platform_id.trim() || null,
        exactmodels: form.wb_exactmodels.trim() || null,
        platform: 'wb',
        recommended_price: form.recommended_price ? parseInt(form.recommended_price) : null,
      });
      
      // Создаем все запросы
      for (const queryData of queriesToCreate) {
        await fetch('/api/categories/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queryData),
        });
      }
      
      setForm({ query: '', platform_id: '', exactmodels: '', wb_platform_id: '', wb_exactmodels: '', platform: 'both', recommended_price: '' });
      setEditingQuery(null);
      await reloadQueries(selectedKey);
    } catch (error) {
      console.error('Ошибка добавления/редактирования запроса:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuery = (queryGroup: QueryCfg[]) => {
    // Объединяем данные из всех запросов группы (Ozon + WB)
    const ozonQuery = queryGroup.find(q => q.platform === 'ozon');
    const wbQuery = queryGroup.find(q => q.platform === 'wb');
    
    setEditingQuery(queryGroup[0]); // Используем первый запрос как основной
    setForm({
      query: queryGroup[0].query,
      platform_id: ozonQuery?.platform_id || '',
      exactmodels: ozonQuery?.exactmodels || '',
      wb_platform_id: wbQuery?.platform_id || '',
      wb_exactmodels: wbQuery?.exactmodels || '',
      platform: 'both' as 'both' | 'ozon' | 'wb', // Всегда 'both' для редактирования
      recommended_price: queryGroup[0].recommended_price ? queryGroup[0].recommended_price.toString() : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingQuery(null);
    setForm({ query: '', platform_id: '', exactmodels: '', wb_platform_id: '', wb_exactmodels: '', platform: 'both', recommended_price: '' });
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
    setShowLoadingOverlay(true);
    try {
      console.log('Deleting query:', { selectedKey, queryText });
      
      const response = await fetch(`/api/categories/queries/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryKey: selectedKey,
          query: queryText
        }),
      });
      
      console.log('Delete response status:', response.status);
      if (response.ok) {
        await reloadQueries(selectedKey);
      } else {
        let result;
        try {
          result = await response.json();
        } catch {
          result = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
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
      setShowLoadingOverlay(false);
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
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
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
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryKey)}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
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
    setEditingCategory(category);
    setCategoryForm({
      key: category.key,
      display: category.display,
      ozon_id: category.ozon_id || '',
      wb_id: category.wb_id || ''
    });
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !categoryForm.key.trim() || !categoryForm.display.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          key: categoryForm.key.trim(),
          display: categoryForm.display.trim(),
          ozon_id: categoryForm.ozon_id.trim() || null,
          wb_id: categoryForm.wb_id.trim() || null,
        }),
      });

      if (response.ok) {
        // Обновляем локальное состояние
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, key: categoryForm.key.trim(), display: categoryForm.display.trim(), ozon_id: categoryForm.ozon_id.trim() || null, wb_id: categoryForm.wb_id.trim() || null }
            : cat
        ));

        setEditingCategory(null);
        setCategoryForm({ key: '', display: '', ozon_id: '', wb_id: '' });
        
        // Перезагружаем категории для синхронизации с сервером
        await reloadCategories();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка сервера при сохранении:', errorData);
        alert(`Ошибка сохранения: ${errorData.message || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения категории:', error);
      alert('Ошибка при сохранении категории');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ key: '', display: '', ozon_id: '', wb_id: '' });
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
      setParsingResult({ success: false, message: 'Выберите категорию для парсинга' });
      setShowParsingPopup(true);
      return;
    }

    setLoading(true);
    setShowParsingPopup(true);
    setParsingResult(null);
    setParsingProgress(0);
    setParsingStage('starting');
    
    let progressInterval: NodeJS.Timeout | null = null;
    let apiResponse: { success: boolean; message: string; data?: { queries_processed?: number; total_products_found?: number } } | null = null;
    let isApiReady = false;
    
    // Запускаем независимую анимацию
    const startAnimation = async () => {
      // Этап 1: "Запуск парсинга..." (1 секунда)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setParsingStage('parsing');
      
      // Этап 2: "Парсинг..." с прогресс-баром
      progressInterval = setInterval(() => {
        setParsingProgress(prev => {
          // Если API готов, ускоряем загрузку
          if (isApiReady && prev < 90) {
            return prev + Math.random() * 20 + 10; // Быстрое заполнение
          }
          // Обычная скорость
          if (prev >= 95) {
            if (progressInterval) clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 3 + 1; // Медленное заполнение
        });
      }, 200);
    };
    
    // Запускаем API запрос
    const apiCall = async () => {
      try {
        console.log('Запуск парсинга для категории:', selectedKey);
        
        const response = await fetch('/api/parsing/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryKey: selectedKey }),
        });

        const result = await response.json();
        apiResponse = result;
        isApiReady = true; // Сигнализируем что API готов
        
        return result;
      } catch (error) {
        console.error('Ошибка при запуске парсинга:', error);
        apiResponse = { success: false, message: 'Ошибка при запуске парсинга' };
        isApiReady = true;
        return apiResponse;
      }
    };
    
    try {
      // Запускаем анимацию
      startAnimation();
      
      // Ждем API ответ
      await apiCall();
      
      // Очищаем интервал сразу после получения ответа
      if (progressInterval) clearInterval(progressInterval);
      
      // Устанавливаем прогресс на 90+ если он еще не достигнут
      setParsingProgress(prev => Math.max(prev, 90));
      
      // Небольшая задержка для плавности
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Этап 3: Завершение анимации
      setParsingStage('completing');
      setParsingProgress(100);
      
      // Задержка для красивого завершения
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Показываем результат
      if (apiResponse) {
        const response = apiResponse as { success: boolean; message: string; data?: { queries_processed?: number; total_products_found?: number } };
        if (response.success) {
          setParsingResult({
            success: true,
            message: `Парсинг завершен успешно!\nОбработано запросов: ${response.data?.queries_processed || 0}\nНайдено товаров: ${response.data?.total_products_found || 0}`,
            data: response.data
          });
        } else {
          setParsingResult({
            success: false,
            message: `Ошибка при запуске парсинга: ${response.message}`
          });
        }
      } else {
        setParsingResult({
          success: false,
          message: 'Ошибка при запуске парсинга: Неизвестная ошибка'
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      if (progressInterval) clearInterval(progressInterval);
      setParsingResult({
        success: false,
        message: 'Ошибка при запуске парсинга'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseParsingPopup = () => {
    setShowParsingPopup(false);
    setParsingResult(null);
    setParsingProgress(0);
    setParsingStage('starting');
  };

  // Убрали автоматические настройки из конфига - теперь все только из БД


  // Убираем ранний return - админка показывается всегда, загрузчик поверх неё

  // Если не авторизован И НЕ проверяем авторизацию, показываем форму авторизации
  if (!isAuthenticated && !isCheckingAuth) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="adminPage">
      <div className="header">
        <div className="header__content">
          <div className="header__info">
            <h1 className="header__title">Админ-панель</h1>
            <p className="header__subtitle">Управление категориями и запросами</p>
          </div>
          <div className="header__user">
            <div className="header__userInfo">
              <span className="header__username">{currentUser?.username}</span>
              <span className="header__role">({currentUser?.role})</span>
            </div>
            <button 
              className="header__logoutButton"
              onClick={handleLogout}
              title="Выйти из системы"
            >
              Выйти
            </button>
          </div>
        </div>
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

          {editingCategory && (
            <div className="form">
              <h3 className="form__title">Редактирование категории &quot;{editingCategory.display}&quot;</h3>

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

              <div className="form__buttons">
                <button
                  className="form__button form__button--secondary"
                  onClick={handleCancelEditCategory}
                  disabled={loading}
                >
                  Отмена
                </button>
                <button
                  className="form__button"
                  disabled={loading || !categoryForm.key.trim() || !categoryForm.display.trim()}
                  onClick={handleSaveCategory}
                >
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          )}

          <div className="categoriesList">
            {categories.map((category) => {
              console.log('Category data:', category);
              return (
              <div
                key={category.id || category.key || Math.random()}
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
              {/* Строка с запросом и ценой */}
              <div className="form__fieldRow">
                <div className="form__fieldGroup">
                  <input
                    className="form__fieldInput"
                    placeholder="Введите поисковый запрос"
                    value={form.query}
                    onChange={(e) => handleFormChange('query', e.target.value)}
                  />
                </div>
                <div className="form__fieldGroup">
                  <input
                    className="form__fieldInput"
                    type="number"
                    placeholder="Цена (₽)"
                    value={form.recommended_price}
                    onChange={(e) => handleFormChange('recommended_price', e.target.value)}
                  />
                </div>
              </div>

              {/* Разделитель */}
              <div className="form__divider">
                <span className="form__dividerText">Настройки платформ</span>
              </div>

              {/* Настройки для Ozon */}
              <div className="form__platformSection">
                <div className="form__platformHeader">
                  <span className="form__platformIcon">🔵</span>
                  <span className="form__platformTitle">Ozon</span>
                </div>
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
              </div>

              {/* Настройки для WB */}
              <div className="form__platformSection">
                <div className="form__platformHeader">
                  <span className="form__platformIcon">🟣</span>
                  <span className="form__platformTitle">WildBerries</span>
                </div>
                <div className="form__fieldRow">
                  <div className="form__fieldGroup">
                    <input
                      className="form__fieldInput"
                      placeholder="Platform ID (WB) - опционально"
                      value={form.wb_platform_id || ''}
                      onChange={(e) => handleFormChange('wb_platform_id', e.target.value)}
                    />
                  </div>
                  <div className="form__fieldGroup">
                    <input
                      className="form__fieldInput"
                      placeholder="Exact Models (WB) - опционально"
                      value={form.wb_exactmodels || ''}
                      onChange={(e) => handleFormChange('wb_exactmodels', e.target.value)}
                    />
                  </div>
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
                          onClick={() => handleEditQuery(queryGroup)}
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
                              <div className="queryPlatform__detail">
                                рекомендуемая цена: {query.recommended_price ? `${query.recommended_price.toLocaleString('ru-RU')} ₽` : '-'}
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
      
      {showLoadingOverlay && (
        <div className="admin__loading-overlay">
          <LoadingSpinner 
            message="Загрузка..." 
            size="medium" 
            variant="overlay" 
            isVisible={showLoadingOverlay} 
          />
        </div>
      )}
      
      {isCheckingAuth && (
        <div className="admin__loading-overlay">
          <LoadingSpinner 
            message="Загрузка..." 
            size="medium" 
            variant="overlay" 
            isVisible={isCheckingAuth} 
          />
        </div>
      )}
      
      {showParsingPopup && (
        <div className="admin__parsing-popup">
          <div className="admin__parsing-content">
            {!parsingResult ? (
              <LoadingSpinner 
                message={
                  parsingStage === 'starting' ? 'Запуск парсинга...' :
                  parsingStage === 'parsing' ? 'Парсинг...' :
                  'Завершение...'
                }
                size="medium" 
                variant="overlay" 
                isVisible={true}
                showProgress={parsingStage === 'parsing' || parsingStage === 'completing'}
                progress={parsingProgress}
              />
            ) : (
              <div className="admin__parsing-result">
                <div className={`admin__parsing-icon ${parsingResult.success ? 'success' : 'error'}`}>
                  {parsingResult.success ? '✅' : '❌'}
                </div>
                <div className="admin__parsing-message">
                  {parsingResult.message.split('\n').map((line) => (
                    <div key={`${line}-${Math.random()}`}>{line}</div>
                  ))}
                </div>
                <button 
                  className="admin__parsing-close"
                  onClick={handleCloseParsingPopup}
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
