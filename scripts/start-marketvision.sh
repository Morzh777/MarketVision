#!/bin/bash

echo "🚀 Запуск MarketVision на домене marketvisionpro.ru..."

# Проверяем что Docker запущен
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен!"
    exit 1
fi

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose down

# Удаляем старые образы (опционально)
echo "🧹 Очищаем старые образы..."
docker system prune -f

# Собираем и запускаем все сервисы
echo "🔨 Собираем и запускаем сервисы..."
docker-compose up -d --build

# Ждем запуска
echo "⏳ Ждем запуска сервисов..."
sleep 30

# Проверяем статус
echo "📊 Проверяем статус сервисов..."
docker-compose ps

echo "✅ MarketVision запущен!"
echo "🌐 Фронтенд: http://localhost:3006"
echo "🔒 HTTPS: https://marketvisionpro.ru"
echo "📱 Telegram Bot: /app команда"

# Показываем логи nginx
echo "📋 Логи Nginx:"
docker-compose logs nginx
