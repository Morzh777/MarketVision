# 🖼️ Кеширование изображений MarketVision

## 📋 Что кешируется

### 1. **Изображения продуктов**
- **Время кеширования:** 1 год (immutable)
- **Форматы:** JPG, PNG, GIF, WebP, AVIF
- **Источники:** WB, Ozon CDN

### 2. **Статические файлы**
- **CSS/JS:** 1 год
- **Шрифты:** 1 год
- **Изображения:** 1 год

### 3. **API данные**
- **Продукты:** 10 минут
- **Популярные запросы:** 10 минут
- **История цен:** 10 минут

## ⚙️ Настройки Next.js

### `next.config.ts`
```typescript
images: {
  // Кеширование изображений
  minimumCacheTTL: 600, // 10 минут
  
  // Оптимизация форматов
  formats: ['image/webp', 'image/avif'],
  
  // Размеры для разных устройств
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### Заголовки кеширования
```typescript
async headers() {
  return [
    {
      source: '/images/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable', // 1 год
        },
      ],
    },
  ];
}
```

## 🔧 Компонент OptimizedImage

### Использование
```typescript
import OptimizedImage from '@/components/OptimizedImage';

<OptimizedImage
  src="https://cdn1.ozone.ru/product-image.jpg"
  alt="RTX 5070"
  width={300}
  height={200}
  priority={true} // для LCP изображений
/>
```

### Особенности
- **Lazy loading** для изображений ниже fold
- **Priority loading** для LCP изображений
- **Fallback** при ошибке загрузки
- **WebP/AVIF** автоматическая конвертация
- **Blur placeholder** во время загрузки

## 📊 Middleware кеширование

### `src/middleware.ts`
```typescript
// Кеширование для изображений
if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
}
```

## 🚀 Преимущества

1. **Быстрая загрузка** - изображения из кеша
2. **Меньше трафика** - не загружаются повторно
3. **Лучший UX** - мгновенное отображение
4. **SEO оптимизация** - быстрые страницы

## 🚨 Важно

- **Immutable кеш** - изображения не меняются
- **1 год кеширования** - долгосрочное хранение
- **WebP/AVIF** - современные форматы
- **Lazy loading** - оптимизация производительности

## 🔄 Обновление изображений

Для обновления изображений:
1. Изменить URL изображения
2. Добавить версию в URL: `image.jpg?v=2`
3. Принудительно сбросить кеш

## 📱 Оптимизация для мобильных

- **Responsive images** - разные размеры для устройств
- **WebP fallback** - поддержка старых браузеров
- **Lazy loading** - загрузка по мере прокрутки
