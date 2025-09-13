import Link from 'next/link'
import { PAGES } from '@/config/pages.config'
import '@/app/styles/components/not-found.scss'

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__title">Ой</h1>
      <p className="not-found__description">
        тут что-то пошло не так...
      </p>
      <Link href={PAGES.HOME()} className="not-found__button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Вернуться на главную
      </Link>
    </div>
  )
}
