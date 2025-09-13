'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CategoriesIcon, QueriesIcon, SettingsIcon } from '@/components/ui/Icons'
import { PAGES } from '@/config/pages.config'

// Компонент кнопки меню
interface MenuButtonProps {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  isActive?: boolean
}

function MenuButton({ href, icon: Icon, title, description, isActive = false }: MenuButtonProps) {
  return (
    <Link 
      href={href}
      className={`admin__menu-button ${isActive ? 'admin__menu-button--active' : ''}`}
    >
      <div className="admin__menu-button-icon">
        <Icon size={18} className="admin__menu-icon" />
      </div>
      <div className="admin__menu-button-content">
        <h3 className="admin__menu-button-title">{title}</h3>
        <p className="admin__menu-button-description">{description}</p>
      </div>
    </Link>
  )
}

export default function AdminMenu() {
  const pathname = usePathname()
  
  return (
    <div className="admin__menu">
      <div className="admin__menu-buttons">
        <MenuButton
          href={PAGES.ADMIN()}
          icon={CategoriesIcon}
          title="Категории"
          description="Управление категориями товаров"
          isActive={pathname === PAGES.ADMIN()}
        />
        
        <MenuButton
          href={PAGES.ADMIN_QUERIES()}
          icon={QueriesIcon}
          title="Запросы"
          description="Популярные поисковые запросы"
          isActive={pathname === PAGES.ADMIN_QUERIES()}
        />
        
        <MenuButton
          href={PAGES.ADMIN_PARSING()}
          icon={SettingsIcon}
          title="Настройка"
          description="Управление парсингом данных"
          isActive={pathname === PAGES.ADMIN_PARSING()}
        />
      </div>
    </div>
  )
}
