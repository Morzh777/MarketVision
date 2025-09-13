'use client'

import { useSession } from 'next-auth/react'
import Categories from '@/components/admin/Categories'
import type { Category } from '@/shared/types/categories.interface'

interface AdminClientProps {
  categories: Category[]
  authToken: string
}

export default function AdminClient({ categories, authToken }: AdminClientProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="admin">
        <div className="admin__header">
          <h1>Админ панель</h1>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="admin">
        <div className="admin__header">
          <h1>Админ панель</h1>
          <p>Ошибка авторизации</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      <div className="admin__header">
        <h1>Админ панель</h1>
        <div className="admin__user-info">
          <p>Добро пожаловать, {session.user?.name?.toUpperCase() || 'АДМИН'}</p>
        </div>
      </div>
      <div className="admin__content">
        <Categories categories={categories} authToken={authToken} />
      </div>
    </div>
  )
}
