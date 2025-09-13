import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'
import LogoutButton from './LogoutButton'

// Серверный компонент для отображения пользователя
async function UserDisplay() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth')?.value
  
  let username = 'Не авторизован'
  
  if (authToken) {
    try {
      const decoded = jwtDecode(authToken) as { username?: string }
      username = decoded.username?.toUpperCase() || 'Не авторизован'
    } catch {
      username = 'Не авторизован'
    }
  }

  return (
    <p>Пользователь: {username}</p>
  )
}

export default async function UserProfile() {
  return (
    <div className="admin__user-info">
      {await UserDisplay()}
      <LogoutButton />
    </div>
  )
}