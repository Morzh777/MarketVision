#!/bin/bash

echo "🚀 Запуск MarketVision API в режиме разработки..."

# Останавливаем продакшн контейнер если запущен
docker-compose down 2>/dev/null

# Запускаем в режиме разработки
docker-compose -f docker-compose.dev.yml up --build -d

echo "✅ Контейнер запущен в режиме разработки!"
echo "📱 Приложение доступно по адресу: http://localhost:3006"
echo "🔄 Hot reload включен - изменения будут применяться автоматически"
echo ""
echo "Команды:"
echo "  docker-compose -f docker-compose.dev.yml logs -f  # Просмотр логов"
echo "  docker-compose -f docker-compose.dev.yml down     # Остановка" 