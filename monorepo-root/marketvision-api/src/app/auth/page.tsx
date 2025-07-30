import LoginForm from '../components/auth/LoginForm'

export const metadata = {
  title: 'Вход в систему - MarketVision',
  description: 'Вход в панель управления парсером'
}

/**
 * Страница входа в систему
 */
export default function AuthPage() {
  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  )
} 