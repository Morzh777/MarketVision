import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api'
import type { Product } from '@/shared/types/products.interface'
import { decodeHtmlEntities } from '@/utils/html'
import ProductMenu from '@/components/menu/ProductMenu'
import { TrendUpChartIcon, TrendDownChartIcon, CartIcon } from '@/components/ui/Icons'
import '@/app/styles/components/Product.scss'

interface Props {
  params: Promise<{ query: string }>
}

// Функция для получения продукта по query из API
async function getProduct(query: string): Promise<Product | null> {
  try {
    const decodedQuery = decodeURIComponent(query)

    // Используем тот же роут что и в marketvision-api
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}?query=${encodeURIComponent(decodedQuery)}`, {
      next: { revalidate: 60 }
    })

    if (response.ok) {
      const data = await response.json()

      if (data.products && data.products.length > 0 && data.marketStats) {
        const productData = data.products[0] // Берем первый продукт
        const product = {
          id: productData.id,
          name: productData.name,
          price: productData.price,
          image_url: productData.image_url,
          product_url: productData.product_url,
          category: productData.category,
          source: productData.source,
          query: productData.query,
          created_at: productData.created_at,
          priceChangePercent: data.priceChangePercent || 0,
          marketStats: data.marketStats
        }
        return product
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Общая функция для получения данных страницы
async function getPageData(query: string) {
  const product = await getProduct(query)
  return { product }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { query } = await params
  const { product } = await getPageData(query)
  
  return {
    title: product ? `${product.name} - MarketVision` : 'MarketVision - Аналитика цен',
    description: product ? `Аналитика цен для ${product.name}` : 'Мониторинг цен на компьютерные комплектующие'
  }
}

export default async function ProductPage({ params }: Props) {
  const { query } = await params
  const decodedQuery = decodeURIComponent(query)
  
  // Получаем telegram_id из cookies (устанавливается middleware)
  const cookieStore = await cookies()
  const telegram_id = cookieStore.get('telegram_id')?.value

  // Получаем данные страницы один раз
  const { product } = await getPageData(query)
  
  if (!product) {
    notFound()
  }
  
  // Функция для определения тренда цены
  const getPriceTrend = (): 'up' | 'down' | 'stable' => {
    if (!product.priceChangePercent) {
      return 'stable'
    }

    const change = product.priceChangePercent
    // Если цена выросла - красная стрелка вверх
    if (change > 0) {
      return 'up'
    }
    // Если цена упала - зеленая стрелка вниз
    if (change < 0) {
      return 'down'
    }
    // Если не изменилась - стабильно
    return 'stable'
  }
  
  const marketStats = product.marketStats!

  // Проверяем статус избранного на сервере
  let isFavorite = false
  if (telegram_id) {
    try {
      const favoriteResponse = await fetch(`${API_BASE_URL}/auth/favorites/${telegram_id}/check/${encodeURIComponent(decodedQuery)}`)
      if (favoriteResponse.ok) {
        const favoriteData = await favoriteResponse.json()
        isFavorite = favoriteData.success && favoriteData.isFavorite
      }
    } catch (error) {
      console.error('Ошибка проверки избранного:', error)
    }
  }

  const nameElement = product.product_url ? (
    <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="productCard__name">
      {decodeHtmlEntities(product.name)}
    </a>
  ) : (
    <h2 className="productCard__name">{decodeHtmlEntities(product.name)}</h2>
  );

  const trend = getPriceTrend()

  const priceElement = product.product_url ? (
    <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="productCard__price productCard__price_link">
      {product.price.toLocaleString().replace(/,/g, ' ')} ₽
    </a>
  ) : (
    <span className="productCard__price">{product.price.toLocaleString().replace(/,/g, ' ')} ₽</span>
  );
  
  return (
    <div className="productPage">
      <ProductMenu query={decodedQuery} telegram_id={telegram_id || undefined} initialIsFavorite={isFavorite} />
      <div className="productCard">
        <div className="productCard__imageSection">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={decodeHtmlEntities(product.name)}
              className="productCard__image"
              fill
              priority={false}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            />
          ) : (
            <div className="productCard__imagePlaceholder">
              <div className="productCard__placeholderIcon">📷</div>
              <span>Нет фото</span>
            </div>
          )}
          
          <div className="productCard__tags">
            {product.source && (
              <div className={`productCard__tag productCard__tag_source productCard__tag_${product.source}`}>
                {product.source.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="productCard__infoSection">{nameElement}</div>

        <div className="productCard__pricingSection">
          <div className="productCard__priceBlock">
            <span className="productCard__priceLabel">Текущая цена</span>
            <div className="productCard__priceRow">
              <div className="productCard__priceContent">
                <div className="productCard__priceLine">
                  {trend !== 'stable' && (
                    trend === 'up' ? (
                      <TrendUpChartIcon className={`productCard__trendIcon trend-${trend}`} size={16} />
                    ) : (
                      <TrendDownChartIcon className={`productCard__trendIcon trend-${trend}`} size={16} />
                    )
                  )}
                  {priceElement}
                </div>
              </div>
            </div>
          </div>

          <div className="productCard__stats">
            <div className="productCard__stat">
              <span className="productCard__statLabel">Рыночная цена</span>
              <div className="productCard__statValue">
                <span className="productCard__marketPrice">{marketStats.mean.toLocaleString().replace(/,/g, ' ')} ₽</span>
              </div>
            </div>

            <div className="productCard__stat">
              <span className="productCard__statLabel">Диапазон цен</span>
              <span className="productCard__statValue">{marketStats.min.toLocaleString().replace(/,/g, ' ')} - {marketStats.max.toLocaleString().replace(/,/g, ' ')} ₽</span>
            </div>

            <div className="productCard__actions">
              <a href={product.product_url} target="_blank" rel="noopener noreferrer" className={`productCard__shopButton productCard__shopButton_${product.source}`}>
                <CartIcon className="productCard__buttonIcon" size={16} />
                <span className="productCard__shopButtonText">Перейти в магазин</span>
              </a>
            </div>
          </div>
        </div>

        <div className="productCard__priceHistory">
          <div className="priceHistory">
            <h3>История цен</h3>
            <div className="priceHistory__chart">
              <p>График истории цен будет здесь</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}