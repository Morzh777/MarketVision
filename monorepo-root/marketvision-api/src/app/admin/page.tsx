'use client'

import { useState, useEffect } from 'react'

import { useAuth } from '../hooks/useAuth'
import '../styles/components/admin.scss'

interface SchedulerStatus {
  isRunning: boolean
  isParsing: boolean
  nextRun: string
  config: Record<string, string[]>
  activeCategories?: Record<string, boolean>
}

interface ServiceStatus {
  name: string
  url: string
  status: 'online' | 'offline' | 'error'
  responseTime?: number
  lastCheck: string
  error?: string
}

interface ServicesStatusResponse {
  summary: {
    total: number
    online: number
    offline: number
    error: number
    healthPercentage: number
  }
  services: ServiceStatus[]
  lastUpdate: string
}

interface ParsingStats {
  totalProducts: number
  totalParsingSessions: number
  categoriesStats: Record<string, {
    productCount: number
    lastParsed: string
    avgPrice: number
    priceRange: { min: number; max: number }
  }>
  sourcesStats: Record<string, {
    productCount: number
    percentage: number
  }>
  recentActivity: {
    last24h: number
    last7days: number
    last30days: number
  }
  topProductsByCategory: Record<string, Array<{
    id: string
    name: string
    price: number
    category: string
    source: string
    created_at: string
    createdAt?: string
  }>>
  priceDistribution: Record<string, number>
  parsingHistory: Array<{
    date: string
    count: number
    categories: string[]
  }>
}

/**
 * Страница администрирования
 */
export default function AdminPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [status, setStatus] = useState<SchedulerStatus | null>(null)
  const [servicesStatus, setServicesStatus] = useState<ServicesStatusResponse | null>(null)
  const [parsingStats, setParsingStats] = useState<ParsingStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentCategoryPage, setCurrentCategoryPage] = useState<Record<string, number>>({})


  // Проверяем аутентификацию
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth'
    }
  }, [user, authLoading])

  // Загружаем статус планировщика и сервисов
  useEffect(() => {
    if (user) {
      fetchStatus()
      fetchServicesStatus()
      fetchParsingStats()
      const interval = setInterval(() => {
        fetchStatus()
        fetchServicesStatus()
        fetchParsingStats()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/scheduler/status')
      const data = await response.json()
      setStatus(data)
    } catch {
      setMessage('Ошибка получения статуса планировщика')
    }
  }

  const fetchServicesStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/service-status')
      const data = await response.json()
      setServicesStatus(data)
    } catch {
      console.error('Ошибка получения статуса сервисов')
    }
  }

  const fetchParsingStats = async (): Promise<void> => {
    try {
                console.log('Загрузка статистики парсинга...')
      const response = await fetch('/api/parsing-stats')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
                console.log('Получена статистика:', data)
      
      // Новый API возвращает данные напрямую, без обертки success/stats
      setParsingStats(data)
    } catch (error) {
      console.error('❌ Ошибка получения статистики парсинга:', error)
    }
  }

  const runParsingNow = async (): Promise<void> => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/scheduler/run-now', { method: 'POST' })
      const data = await response.json()
      setMessage(`Парсинг запущен: ${data.message}`)
      await fetchStatus()
    } catch {
      setMessage('Ошибка запуска парсинга')
    } finally {
      setLoading(false)
    }
  }

  const startScheduler = async (): Promise<void> => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/scheduler/start', { method: 'POST' })
      const data = await response.json()
      setMessage(`Планировщик запущен: ${data.message}`)
      await fetchStatus()
    } catch {
      setMessage('Ошибка запуска планировщика')
    } finally {
      setLoading(false)
    }
  }

  const stopScheduler = async (): Promise<void> => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/scheduler/stop', { method: 'POST' })
      const data = await response.json()
      setMessage(`Планировщик остановлен: ${data.message}`)
      await fetchStatus()
    } catch {
      setMessage('Ошибка остановки планировщика')
    } finally {
      setLoading(false)
    }
  }

  const updateCategories = async (categories: Record<string, boolean>): Promise<void> => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/scheduler/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeCategories: categories })
      })
      const data = await response.json()
      setMessage(`Категории обновлены: ${data.message}`)
      await fetchStatus()
    } catch {
      setMessage('Ошибка обновления категорий')
    } finally {
      setLoading(false)
    }
  }

  const nextCategoryPage = (category: string): void => {
    const currentPage = currentCategoryPage[category] || 0
    const products = parsingStats?.topProductsByCategory[category] || []
    const maxPage = Math.ceil(products.length / 2) - 1
    
    if (currentPage < maxPage) {
      setCurrentCategoryPage(prev => ({
        ...prev,
        [category]: currentPage + 1
      }))
    }
  }

  const prevCategoryPage = (category: string): void => {
    const currentPage = currentCategoryPage[category] || 0
    
    if (currentPage > 0) {
      setCurrentCategoryPage(prev => ({
        ...prev,
        [category]: currentPage - 1
      }))
    }
  }

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading) {
    return <div className={container}>Проверка аутентификации...</div>
  }

  // Если пользователь не авторизован, не показываем контент
  if (!user) {
    return null
  }

  if (!status) {
    return <div className={container}>Загрузка...</div>
  }

  return (
    <div className={container}>
      <div className={header}>
        <h1>
          <span className={fullTitle}>Market Vision</span>
          <span className={shortTitle}>MV</span>
        </h1>
        <div className={userInfo}>
          <button onClick={logout} className={logoutButton}>
            Выйти
          </button>
        </div>
      </div>
      
      <div className={section}>
        <h2>Планировщик парсинга</h2>
        
        <div className={statusCard}>
          <div className={statusRow}>
            <span>Статус планировщика:</span>
            <span className={status.isRunning ? running : stopped}>
              {status.isRunning ? 'Запущен' : 'Остановлен'}
            </span>
          </div>
          
          <div className={statusRow}>
            <span>Статус парсинга:</span>
            <span className={status.isParsing ? running : stopped}>
              {status.isParsing ? 'Выполняется' : 'Ожидает'}
            </span>
          </div>
          
          <div className={statusRow}>
            <span>Следующий запуск:</span>
            <span>{new Date(status.nextRun).toLocaleString('ru-RU')}</span>
          </div>
        </div>

        <div className={actions}>
          <button 
            onClick={runParsingNow}
            disabled={loading}
            className={runButton}
          >
            {loading ? 'Запуск...' : 'Запустить парсинг сейчас'}
          </button>
          
          <button 
            onClick={startScheduler}
            disabled={loading || status.isRunning}
            className={startButton}
          >
            Запустить планировщик
          </button>
          
          <button 
            onClick={stopScheduler}
            disabled={loading || !status.isRunning}
            className={stopButton}
          >
            Остановить планировщик
          </button>
          
          <button 
            onClick={fetchStatus}
            className={refreshButton}
          >
            Обновить статус
          </button>
        </div>

        {message && (
          <div className={message}>
            {message}
          </div>
        )}
      </div>

      {/* Статус сервисов */}
      <div className={section}>
        <h2>Статус сервисов</h2>
        
        {servicesStatus ? (
          <>
            <div className={servicesOverview}>
              <div className={overviewCard}>
                <h3>Общая статистика</h3>
                <div className={statusRow}>
                  <span>Всего сервисов:</span>
                  <span>{servicesStatus.summary.total}</span>
                </div>
                <div className={statusRow}>
                  <span>Онлайн:</span>
                  <span className={online}>{servicesStatus.summary.online}</span>
                </div>
                <div className={statusRow}>
                  <span>Офлайн:</span>
                  <span className={offline}>{servicesStatus.summary.offline}</span>
                </div>
                <div className={statusRow}>
                  <span>Ошибки:</span>
                  <span className={error}>{servicesStatus.summary.error}</span>
                </div>
                <div className={statusRow}>
                  <span>Здоровье системы:</span>
                  <span className={`${healthPercentage} ${
                    servicesStatus.summary.healthPercentage >= 75 ? healthy : 
                    servicesStatus.summary.healthPercentage >= 50 ? warning : critical
                  }`}>
                    {servicesStatus.summary.healthPercentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className={servicesGrid}>
              {servicesStatus.services.map((service) => (
                <div 
                  key={service.name} 
                  className={`${serviceCard} ${service.status}`}
                >
                  <div className={serviceHeader}>
                    <h3>{service.name}</h3>
                    <span className={`${statusBadge} ${service.status}`}>
                      {service.status === 'online' ? '🟢 Онлайн' : 
                       service.status === 'offline' ? '🔴 Офлайн' : '🚨 Ошибка'}
                    </span>
                  </div>
                  
                  <div className={serviceDetails}>
                    <div className={statusRow}>
                      <span>URL:</span>
                      <code>{service.url}</code>
                    </div>
                    
                    {service.responseTime && (
                      <div className={statusRow}>
                        <span>Время ответа:</span>
                        <span className={service.responseTime < 1000 ? fast : slow}>
                          {service.responseTime}ms
                        </span>
                      </div>
                    )}
                    
                    <div className={statusRow}>
                      <span>Последняя проверка:</span>
                      <span>{new Date(service.lastCheck).toLocaleString('ru-RU')}</span>
                    </div>
                    
                    {service.error && (
                      <div className={statusRow}>
                        <span>Ошибка:</span>
                        <span className={errorText}>{service.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={loading}>Загрузка статуса сервисов...</div>
        )}
      </div>

      {/* Статистика парсинга */}
      <div className={section}>
  
        
        {parsingStats ? (
          <>
            {/* Общая статистика */}
            <div className={statsOverview}>
              <div className={statsCard}>
                <h3>Общие показатели</h3>
                <div className={statsGridNew}>
                  <div className={statItem}>
                    <span className={statValue}>{parsingStats.totalProducts.toLocaleString()}</span>
                    <span className={statLabel}>Всего товаров</span>
                  </div>
                  <div className={statItem}>
                    <span className={statValue}>{parsingStats.totalParsingSessions}</span>
                    <span className={statLabel}>Сессий парсинга</span>
                  </div>
                  <div className={statItem}>
                    <span className={statValue}>{Object.keys(parsingStats.categoriesStats).length}</span>
                    <span className={statLabel}>Категорий</span>
                  </div>
                  <div className={statItem}>
                    <span className={statValue}>{Object.keys(parsingStats.sourcesStats).length}</span>
                    <span className={statLabel}>Источников</span>
                  </div>
                </div>
              </div>

              <div className={statsCard}>
                <h3>Активность</h3>
                <div className={statsGridNew}>
                  <div className={statItem}>
                    <span className={statValue}>{parsingStats.recentActivity.last24h}</span>
                    <span className={statLabel}>За 24 часа</span>
                  </div>
                  <div className={statItem}>
                    <span className={statValue}>{parsingStats.recentActivity.last7days}</span>
                    <span className={statLabel}>За 7 дней</span>
                  </div>
                  <div className={statItem}>
                    <span className={statValue}>{parsingStats.recentActivity.last30days}</span>
                    <span className={statLabel}>За 30 дней</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика по категориям */}
            <div className={categoriesStatsGrid}>
              <div className={statsCard}>
                <h3>Статистика по категориям</h3>
                <div className={categoriesTable}>
                  {Object.entries(parsingStats.categoriesStats || {}).map(([category, stats]) => (
                    <div key={category} className={categoryRow}>
                      <div className={categoryName}>{category}</div>
                      <div className={categoryStats}>
                        <span>{stats.productCount} шт.</span>
                        <span>Средняя цена: {stats.avgPrice?.toLocaleString() || 0}&#8381;</span>
<span>От {stats.priceRange?.min?.toLocaleString() || 0}&#8381; до {stats.priceRange?.max?.toLocaleString() || 0}&#8381;</span>
                        <span>Обновлено: {new Date(stats.lastParsed).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={statsCard}>
                <h3>Источники данных</h3>
                <div className={sourcesTable}>
                  {Object.entries(parsingStats.sourcesStats || {}).map(([source, stats]) => (
                    <div key={source} className={sourceRow}>
                      <div className={sourceName}>{source}</div>
                      <div className={sourceStats}>
                                                    <span className={sourceCount}>{stats.productCount} шт.</span>
                        <span className={sourcePercentage}>{stats.percentage}%</span>
                        <div className={progressBar}>
                          <div 
                            className={progressFill} 
                            style={{ '--progress-width': `${stats.percentage}%` } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

                        {/* Топ товары по категориям */}
            <div className={statsCard}>
              <h3>Топ товары по цене в категориях</h3>
              <div className={topProductsByCategory}>
                {Object.entries(parsingStats.topProductsByCategory || {}).map(([category, products]) => {
                  const currentPage = currentCategoryPage[category] || 0
                  const itemsPerPage = 2
                  const startIndex = currentPage * itemsPerPage
                  const endIndex = startIndex + itemsPerPage
                  const currentProducts = (products || []).slice(startIndex, endIndex)
                  const totalPages = Math.ceil((products || []).length / itemsPerPage)
                  
                  return (
                    <div key={category} className={categorySection}>
                      <h4 className={categoryTitle}>{category}</h4>
                      <div className={topProductsTable}>
                        {currentProducts.map((product, index) => (
                          <div key={product.id || index} className={productRow}>
                            <div className={productRank}>#{startIndex + index + 1}</div>
                            <div className={productInfo}>
                              <div className={productName}>{product.name}</div>
                              <div className={productMeta}>
                                {product.source} • {(() => {
                                  try {
                                    const dateValue = product.created_at || product.createdAt;
                                    if (!dateValue) return 'Дата неизвестна';
                                    const date = new Date(dateValue);
                                    return isNaN(date.getTime()) ? 'Дата неизвестна' : date.toLocaleDateString('ru-RU');
                                  } catch {
                                    return 'Дата неизвестна';
                                  }
                                })()}
                              </div>
                            </div>
                            <div className={productPrice}>{product.price?.toLocaleString()}&#8381;</div>
                          </div>
                        ))}
                      </div>
                      
                      {totalPages > 1 && (
                        <div className={pagination}>
                          <button 
                            onClick={() => prevCategoryPage(category)}
                            disabled={currentPage === 0}
                            className={paginationButton}
                          >
                            ←
                          </button>
                          <span className={paginationInfo}>
                            {currentPage + 1} из {totalPages}
                          </span>
                          <button 
                            onClick={() => nextCategoryPage(category)}
                            disabled={currentPage === totalPages - 1}
                            className={paginationButton}
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Распределение цен */}
            <div className={statsCard}>
              <h3>Распределение по ценам</h3>
              <div className={priceDistribution}>
                {Object.entries(parsingStats.priceDistribution || {}).map(([range, count]) => {
                  const totalProducts = Object.values(parsingStats.priceDistribution || {}).reduce((sum: number, val: number) => sum + val, 0);
                  const percentage = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
                  const maxCount = Math.max(...Object.values(parsingStats.priceDistribution || {}));
                  
                  return (
                    <div key={range} className={priceRange}>
                      <div className={priceLabel}>
                        {range.replace(/(\d+)/g, (match) => parseInt(match).toLocaleString('ru-RU'))}&#8381;
                      </div>
                      <div className={priceBar}>
                        <div 
                          className={priceBarFill}
                          style={{ 
                            '--bar-width': `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` 
                          } as React.CSSProperties}
                        />
                      </div>
                      <div className={priceCount}>
                        {count.toLocaleString('ru-RU')} ({percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* История парсинга */}
            <div className={statsCard}>
              <h3>История парсинга (7 дней)</h3>
              <div className={historyChart}>
                {(parsingStats.parsingHistory || []).length > 0 ? (
                  (parsingStats.parsingHistory || []).map((day, index) => {
                    const maxCount = Math.max(...(parsingStats.parsingHistory || []).map(d => d.count), 1);
                    const heightPercent = maxCount > 0 ? Math.max(10, (day.count / maxCount) * 80) : 10;
                    
                    return (
                      <div key={index} className={historyDay}>
                        <div className={historyDate}>
                          {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}
                        </div>
                        <div className={historyBar}>
                          <div 
                            className={historyBarFill}
                            style={{ 
                              '--bar-height': `${heightPercent}%` 
                            } as React.CSSProperties}
                          />
                        </div>
                        <div className={historyCount}>{day.count}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className={noDataMessage}>
                    Нет данных за последние 7 дней
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={loading}>Загрузка статистики парсинга...</div>
        )}
      </div>

      <div className={section}>
        <h2>Управление категориями</h2>
        <div className={configGrid}>
          {Object.entries(status.config).map(([category, queries]) => {
            const isActive = status.activeCategories?.[category] || false
            return (
              <div key={category} className={`${configCard} ${isActive ? activeCard : inactiveCard}`}>
                <h3>{category}</h3>
                <p>Запросы: {queries.join(', ')}</p>
                <div className={categoryToggle}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => {
                        const newCategories = {
                          ...status.activeCategories,
                          [category]: e.target.checked
                        }
                        updateCategories(newCategories)
                      }}
                      disabled={loading}
                    />
                    <span>{isActive ? 'Активна' : 'Неактивна'}</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 