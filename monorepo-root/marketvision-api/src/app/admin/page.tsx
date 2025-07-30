'use client'

import { useState, useEffect } from 'react'

import { useAuth } from '../hooks/useAuth'
import styles from '../styles/components/admin.module.scss'

interface SchedulerStatus {
  isRunning: boolean
  isParsing: boolean
  nextRun: string
  config: Record<string, string[]>
  activeCategories?: Record<string, boolean>
}

/**
 * Страница администрирования
 */
export default function AdminPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [status, setStatus] = useState<SchedulerStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Проверяем аутентификацию
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth'
    }
  }, [user, authLoading])

  // Загружаем статус планировщика
  useEffect(() => {
    if (user) {
      fetchStatus()
      const interval = setInterval(fetchStatus, 30000)
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

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading) {
    return <div className={styles.container}>Проверка аутентификации...</div>
  }

  // Если пользователь не авторизован, не показываем контент
  if (!user) {
    return null
  }

  if (!status) {
    return <div className={styles.container}>Загрузка...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Админка MarketVision</h1>
        <div className={styles.userInfo}>
          <span>Пользователь: {user.username}</span>
          <button onClick={logout} className={styles.logoutButton}>
            Выйти
          </button>
        </div>
      </div>
      
      <div className={styles.section}>
        <h2>Планировщик парсинга</h2>
        
        <div className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span>Статус планировщика:</span>
            <span className={status.isRunning ? styles.running : styles.stopped}>
              {status.isRunning ? 'Запущен' : 'Остановлен'}
            </span>
          </div>
          
          <div className={styles.statusRow}>
            <span>Статус парсинга:</span>
            <span className={status.isParsing ? styles.running : styles.stopped}>
              {status.isParsing ? 'Выполняется' : 'Ожидает'}
            </span>
          </div>
          
          <div className={styles.statusRow}>
            <span>Следующий запуск:</span>
            <span>{new Date(status.nextRun).toLocaleString('ru-RU')}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={runParsingNow}
            disabled={loading}
            className={styles.runButton}
          >
            {loading ? 'Запуск...' : 'Запустить парсинг сейчас'}
          </button>
          
          <button 
            onClick={startScheduler}
            disabled={loading || status.isRunning}
            className={styles.startButton}
          >
            Запустить планировщик
          </button>
          
          <button 
            onClick={stopScheduler}
            disabled={loading || !status.isRunning}
            className={styles.stopButton}
          >
            Остановить планировщик
          </button>
          
          <button 
            onClick={fetchStatus}
            className={styles.refreshButton}
          >
            Обновить статус
          </button>
        </div>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>Управление категориями</h2>
        <div className={styles.configGrid}>
          {Object.entries(status.config).map(([category, queries]) => {
            const isActive = status.activeCategories?.[category] || false
            return (
              <div key={category} className={`${styles.configCard} ${isActive ? styles.activeCard : styles.inactiveCard}`}>
                <h3>{category}</h3>
                <p>Запросы: {queries.join(', ')}</p>
                <div className={styles.categoryToggle}>
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
                    {isActive ? 'Активна' : 'Неактивна'}
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