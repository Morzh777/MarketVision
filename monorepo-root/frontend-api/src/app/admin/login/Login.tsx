'use client'

import { LoginForm } from '@/components/forms/LoginForm'

export const Login = () => {

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__header">
          <h1 className="login-page__title">Вход в админ панель</h1>
          <p className="login-page__subtitle">
            Введите ваши данные для доступа к административной панели
          </p>
          <div className="login-page__test-credentials">
            <p><strong>Для входа используйте данные администратора</strong></p>
            <p>Обратитесь к администратору системы для получения доступа</p>
          </div>
        </div>
        
        <div className="login-page__form">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
