'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PAGES } from '@/config/pages.config'
import { ChevronDownIcon } from '@/components/ui/Icons'
import '@/app/styles/components/CategoryMenu.scss'

interface Category {
  key: string
  display: string
}

interface Props {
  categories: Category[]
}

export default function CategoryMenuClient({ 
  categories
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedCategory = searchParams.get('category') || 'all'
  const showFavorites = searchParams.get('filter') === 'favorites'
  const [isOpen, setIsOpen] = useState(false)
  
  const getDisplayText = () => {
    if (showFavorites) return 'Избранное'
    if (selectedCategory === 'all') return 'Все запросы'
    const category = categories.find(cat => cat.key === selectedCategory)
    return category?.display || 'Все запросы'
  }

  const toggleOverlay = () => {
    const overlay = document.getElementById('category-overlay')
    const drawer = overlay?.querySelector('.category-menu__drawer')
    
    if (!overlay || !drawer) return
    
    const isCurrentlyOpen = overlay.style.display !== 'none'
    
    if (isCurrentlyOpen) {
      drawer.classList.add('closing')
      setIsOpen(false)
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      
      setTimeout(() => {
        overlay.style.display = 'none'
        drawer.classList.remove('closing')
      }, 300)
    } else {
      overlay.style.display = 'block'
      setIsOpen(true)
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }
  }

  const closeOverlay = () => {
    const overlay = document.getElementById('category-overlay')
    const drawer = overlay?.querySelector('.category-menu__drawer')
    
    if (!overlay || !drawer) return
    
    drawer.classList.add('closing')
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    setIsOpen(false)
    
    setTimeout(() => {
      overlay.style.display = 'none'
      drawer.classList.remove('closing')
    }, 300)
  }

  return (
    <div className="category-menu">
      <button 
        type="button" 
        className="category-menu__button" 
        onClick={toggleOverlay}
      >
        <span className="category-menu__label">
          {getDisplayText()}
        </span>
        <ChevronDownIcon 
          size={20} 
          className="category-menu__caret"
        />
      </button>
      
      <div 
        className="category-menu__overlay" 
        id="category-overlay" 
        style={{ display: 'none' }}
        onClick={closeOverlay}
      >
        <div 
          className="category-menu__drawer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="category-menu__header">
            <span>Выберите категорию</span>
            <button 
              type="button" 
              className="category-menu__close" 
              onClick={closeOverlay}
            >
              ✕
            </button>
          </div>
          
          <ul className="category-menu__list">
            <li className="category-menu__item">
              <button
                onClick={() => {
                  closeOverlay()
                  router.push(PAGES.HOME())
                }}
                className={`category-menu__link ${selectedCategory === 'all' && !showFavorites ? 'active' : ''}`}
              >
                Все запросы
              </button>
            </li>
            
            {categories.map((category) => (
              <li key={category.key} className="category-menu__item">
                <a
                  href={PAGES.CATEGORY(category.key)}
                  className={`category-menu__link ${selectedCategory === category.key && !showFavorites ? 'active' : ''}`}
                >
                  {category.display}
                </a>
              </li>
            ))}
            
            <li className="category-menu__item category-menu__item--favorites">
              <a
                href={PAGES.FAVORITES_FILTER()}
                className={`category-menu__link ${showFavorites ? 'active' : ''}`}
              >
                Избранное
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
