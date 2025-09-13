'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  return (
    <button 
      onClick={handleLogout} 
      className="admin__logout-btn"
    >
      Выйти
    </button>
  )
}
