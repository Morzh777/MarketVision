
'use client'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { HomeIcon, HomeSolidIcon, HeartIcon, HeartSolidIcon, QuestionIcon } from '@/components/ui/Icons'
import { PAGES } from '@/config/pages.config'
import '@/app/styles/components/UserMenu.scss'

export default function Menu() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category')
  const filter = searchParams.get('filter')
  
  // Домик активен только когда мы на главной БЕЗ категории и БЕЗ фильтра
  const isHome = pathname === PAGES.HOME() && !category && !filter
  const isFavorites = filter === 'favorites'
  
  // Получаем telegram_id из URL параметров (приоритет) или cookies
  const getTelegramId = () => {
    if (typeof window !== 'undefined') {
      // Сначала пробуем получить из URL
      const urlParams = new URLSearchParams(window.location.search)
      const telegramIdFromUrl = urlParams.get('telegram_id')
      
      if (telegramIdFromUrl) {
        return telegramIdFromUrl
      }
      
      // Если нет в URL, пробуем из cookies
      const allCookies = document.cookie
      const telegramIdFromCookie = allCookies
        .split('; ')
        .find(row => row.startsWith('telegram_id='))
        ?.split('=')[1]
      
      return telegramIdFromCookie || '171989'
    }
    return '171989'
  }
  
  const handleFavoritesClick = () => {
    // Переходим на избранное без добавления telegram_id в URL
    router.push(`/?filter=favorites`)
  }

  return (
    <nav className="menu" aria-label="User navigation">
      <Link
        href={PAGES.HOME()}
        className="menu__btn"
        aria-label="Главная"
      >
        {isHome ? <HomeSolidIcon size={20} /> : <HomeIcon size={20} />}
      </Link>

      <button
        onClick={handleFavoritesClick}
        className="menu__btn"
        aria-label="Избранное"
      >
        {isFavorites ? <HeartSolidIcon size={20} /> : <HeartIcon size={20} />}
      </button>

      <Link
        href={PAGES.HELP()}
        className="menu__btn"
        aria-label="Справка"
        onClick={(e) => {
          e.preventDefault()
          // TODO: Реализовать справку
        }}
      >
        <QuestionIcon size={20} />
      </Link>
    </nav>
  )
}