
class PagesConfig {
  HOME() {
    return '/'
  }
  
  PRODUCT(query: string) {
    return `/product/${encodeURIComponent(query)}`
  }
  
  PRODUCTS() {
    return '/products'
  }
  
  FAVORITES() {
    return '/favorites'
  }
  
  HELP() {
    return '/help'
  }
  
  // Категории
  CATEGORY(categoryKey: string) {
    return `/?category=${categoryKey}`
  }
  
  FAVORITES_FILTER() {
    return '/?filter=favorites'
  }
  
  // Админские страницы
  ADMIN() {
    return '/admin'
  }
  
  ADMIN_QUERIES() {
    return '/admin/queries'
  }
  
  ADMIN_PARSING() {
    return '/admin/parsing'
  }
}

export const PAGES = new PagesConfig()

