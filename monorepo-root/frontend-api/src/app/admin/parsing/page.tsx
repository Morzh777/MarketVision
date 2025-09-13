import { Suspense } from 'react'
import ParsingClient from './components/ParsingClient'
import LogoutButton from '@/components/admin/UserProfile'
import AdminMenu from '@/components/admin/Menu'
import { cookies } from 'next/headers'
import '@/app/styles/components/Admin.scss'

export default async function ParsingPage() {
  let categories: any[] = []
  let error: string | null = null
  
  // Получаем токен из cookies
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth')?.value || ''

  try {
    const response = await fetch('http://marketvision-nginx-dev/api/categories', {
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
        <div className="admin__fixed-header">
          <div className="admin__header">
            <h1>Market Vision Setup</h1>
            <LogoutButton />
          </div>
        </div>
        <div className="admin__content">
          <div className="admin__error">
            <p>Ошибка: {error}</p>
          </div>
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
        <div className="admin-page">
          <div className="admin-page__header">
            <h1 className="admin-page__title">Настройки парсинга</h1>
            <p className="admin-page__description">
              Управление парсингом данных по категориям
            </p>
          </div>
          
          <Suspense fallback={<div>Загрузка...</div>}>
            <ParsingClient categories={categories} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
