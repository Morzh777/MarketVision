#!/bin/bash

echo "🗄️ Инициализация базы данных MarketVision..."

# Ждем готовности PostgreSQL
echo "⏳ Ожидание PostgreSQL..."
until pg_isready -h postgres -U marketvision -d marketvision; do
  echo "PostgreSQL еще не готов..."
  sleep 2
done

echo "✅ PostgreSQL готов!"

# Применяем миграции
echo "🔄 Применение миграций..."
npx prisma migrate deploy

# Генерируем Prisma Client
echo "🔧 Генерация Prisma Client..."
npx prisma generate

echo "✅ База данных инициализирована!" 