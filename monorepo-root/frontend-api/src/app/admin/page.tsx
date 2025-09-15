import Categories from '@/components/admin/Categories'
import LogoutButton from '@/components/admin/UserProfile'
import AdminMenu from '@/components/admin/Menu'
import type { Category } from '@/shared/types/categories.interface'
import { cookies } from 'next/headers'
import { createInternalApiUrl } from '@/constants/api'

// Серверный компонент - загружает данные на сервере
export default async function AdminPage() {
  let categories: Category[] = []
  let error: string | null = null
  
  // Получаем токен из cookies
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth')?.value || ''

  try {
    const response = await fetch(createInternalApiUrl('/api/categories'), {
      next: { revalidate: 0 } // Не кэшируем для актуальных данных
    })

    if (response.ok) {
      categories = await response.json()
    } else {
      error = `Ошибка загрузки категорий: ${response.status}`
    }
  } catch (err) {
    error = 'Ошибка подключения к серверу'
    console.error('Error fetching categories:', err)
  }

  if (error) {
    return (
      <div className="admin">
        <div className="admin__header">
          <h1>Market Vision Setup</h1>
          <LogoutButton />
        </div>
        <div className="admin__content">
          <div className="error">Ошибка: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      <div className="admin__fixed-header">
        <div className="admin__header">
          <h1>Market Vision Setup</h1>
          <LogoutButton />
        </div>
        
        <AdminMenu />
      </div>
      
      <div className="admin__content">
        <Categories categories={categories} authToken={authToken} />
      </div>
    </div>
  )
}
