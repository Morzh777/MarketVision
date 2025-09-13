'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { loginSchema, type LoginFormData } from '@/shared/schemas/auth.schema'

interface LoginFormProps {
  isLoading?: boolean
}

export const LoginForm = ({ isLoading = false }: LoginFormProps) => {
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: '',
      password: ''
    }
  })

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      setError('')
      
      const result = await login(data.login, data.password)

      if (!result.success) {
        setError(result.message || 'Неверный логин или пароль')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при авторизации')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="login-form">
      <div className="login-form__field">
        <label htmlFor="login" className="login-form__label">
          Логин
        </label>
        <input
          {...register('login')}
          type="text"
          id="login"
          className="login-form__input"
          placeholder="Введите ваш логин (только английские буквы, цифры, _ и -)"
          disabled={isLoading}
        />
        {errors.login && (
          <span className="login-form__error">{errors.login.message}</span>
        )}
      </div>

      <div className="login-form__field">
        <label htmlFor="password" className="login-form__label">
          Пароль
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="login-form__input"
          placeholder="Введите пароль"
          disabled={isLoading}
        />
        {errors.password && (
          <span className="login-form__error">{errors.password.message}</span>
        )}
      </div>

      {error && (
        <div className="login-form__error-message">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="login-form__submit"
        disabled={isLoading}
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}
