// Утилиты для работы с валютой

// HTML entity для символа рубля
export const RUBLE_SYMBOL = '&#8381;';

// Unicode символ рубля (альтернатива)
export const RUBLE_UNICODE = '\u20BD';

// Форматирование цены с символом рубля
export const formatPriceWithRuble = (price: number): string => {
  return `${Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')} ${RUBLE_SYMBOL}`;
};

// Форматирование цены без символа рубля
export const formatPrice = (price: number): string => {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
};

// Форматирование диапазона цен
export const formatPriceRange = (min: number, max: number): string => {
  return `${formatPrice(min)} - ${formatPrice(max)} ${RUBLE_SYMBOL}`;
}; 