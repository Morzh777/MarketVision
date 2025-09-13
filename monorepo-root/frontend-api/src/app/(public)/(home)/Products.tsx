import Image from 'next/image'
import Link from 'next/link'
import { useRef, useCallback, memo } from 'react'
import '@/app/styles/components/products.scss'
import { PAGES } from '@/config/pages.config'
import type { Products } from '@/shared/types/products.interface'

interface Props {
  products: Products[]
  className?: string
  telegram_id?: string
}

function Products({ products, className = '', telegram_id: _telegram_id }: Props) {
  const lastClickTime = useRef<number>(0)
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now()
    if (now - lastClickTime.current < 300) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
    lastClickTime.current = now
  }, [])
  
  if (!Array.isArray(products)) {
    return <div>Ошибка: products не является массивом</div>
  }
  
  return (
    <ul className={`products-list ${className}`}>
      {products.map((product) => (
        <Link 
          key={product.query} 
          href={PAGES.PRODUCT(product.query)}
          className="products__item"
          onClick={handleClick}
        >
          <div className="products__item-avatar">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.query}
                width={32}
                height={32}
                className="products__item-avatar-img"
              />
            ) : (
              <div className="products__item-avatar-inner">
                {product.query.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="products__item-content">
            <span className="products__item-name">{product.query}</span>
          </div>
          <span className="products__item-price">{(product.minPrice || 0).toLocaleString('ru-RU')} ₽</span>
          <span className={`products__item-percent ${(product.priceChangePercent || 0) <= 0 ? 'products__item-percent--green' : 'products__item-percent--red'}`}>
            {(product.priceChangePercent || 0) > 0 ? '+' : ''}{(product.priceChangePercent || 0).toFixed(1)}%
          </span>
        </Link>
      ))}
    </ul>
  )
}

export default memo(Products)


