#!/bin/bash

echo "🚀 Запуск MarketVision API в продакшн режиме..."

# Останавливаем dev контейнер если запущен
docker-compose -f docker-compose.dev.yml down 2>/dev/null

# Запускаем в продакшн режиме
docker-compose up --build -d

echo "✅ Контейнер запущен в продакшн режиме!"
echo "📱 Приложение доступно по адресу: http://localhost:3006"
echo ""
echo "Команды:"
echo "  docker-compose logs -f  # Просмотр логов"
echo "  docker-compose down     # Остановка" 