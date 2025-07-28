/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Основные цвета
        'bg': '#181A20',
        'bg-light': '#20232B',
        'bg-card': '#20232B',
        'bg-active': '#23272F',
        
        // Текст
        'text': '#E5E7EB',
        'text-secondary': '#9CA3AF',
        
        // Границы
        'border': '#23272F',
        
        // Акцентные цвета
        'blue': '#3B82F6',
        'blue-dark': '#2563EB',
        
        // Магазины
        'wb': '#cb11ab',
        'ozon': '#005bff',
        
        // Статусы
        'green': '#22C55E',
        'red': '#EF4444',
        'yellow': '#FBBF24',
        'purple': '#8B5CF6',
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
} 