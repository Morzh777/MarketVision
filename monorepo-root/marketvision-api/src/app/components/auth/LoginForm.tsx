'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import styles from '../../styles/components/auth-form.module.scss'

interface LoginFormProps {
  onSuccess?: () => void
}

/**
 * Компонент формы входа в систему
 */
export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedUsername = localStorage.getItem('marketvision_username')
    if (savedUsername) {
      setUsername(savedUsername)
    }

    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    
    if (errorParam === 'admin_required') {
      setError('Для доступа к панели управления требуются права администратора')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('marketvision_username', username)
        localStorage.setItem('auth-token', data.token)
        
        onSuccess?.()
        router.push('/admin')
      } else {
        setError(data.message || 'Ошибка входа')
      }
    } catch {
      setError('Ошибка сети. Попробуйте еще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* Логотип */}
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>
            <svg className={styles.authLogoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className={styles.authTitle}>MarketVision</h1>
          <p className={styles.authSubtitle}>Панель администратора</p>
        </div>

        {/* Форма */}
        <div className={styles.authFormContainer}>
          <h2 className={styles.authFormTitle}>Вход в систему</h2>
          
          <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
            {/* Логин */}
            <div className={styles.formField}>
              <label htmlFor="username" className={styles.formLabel}>
                Логин
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={styles.formInput}
                  placeholder="Введите логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Пароль */}
            <div className={styles.formField}>
              <label htmlFor="password" className={styles.formLabel}>
                Пароль
              </label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={styles.formInput}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div className={styles.errorMessage}>
                <div className={styles.errorIcon}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading}
              className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
            >
              {isLoading ? (
                <div className={styles.loadingContent}>
                  <svg className={styles.loadingSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className={styles.loadingSpinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className={styles.loadingSpinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Вход...
                </div>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Подсказка */}
          <div className={styles.authHint}>
            <p>Для доступа к панели управления парсером</p>
          </div>
        </div>

        {/* Футер */}
        <div className={styles.authFooter}>
          <p>© 2024 MarketVision. Все права защищены.</p>
        </div>
      </div>
    </div>
  )
} 