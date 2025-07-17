#!/bin/bash

echo "🔄 Сортировка импортов во всех проектах MarketVision..."

# TypeScript/JavaScript проекты
echo "📦 Сортировка импортов в TypeScript проектах..."

# Bot
echo "🤖 Bot..."
cd monorepo-root/bot
npx eslint --fix src/ || echo "⚠️ Ошибки в Bot (но импорты отсортированы)"

# DB API
echo "🗄️ DB API..."
cd ../db-api
npx eslint --fix src/ || echo "⚠️ Ошибки в DB API (но импорты отсортированы)"

# Product Filter Service
echo "🔍 Product Filter Service..."
cd ../product-filter-service
npx eslint --fix src/ || echo "⚠️ Ошибки в Product Filter Service (но импорты отсортированы)"

# WB API
echo "📦 WB API..."
cd ../wb-api
npx eslint --fix src/ || echo "⚠️ Ошибки в WB API (но импорты отсортированы)"

# MarketVision API (Next.js)
echo "🌐 MarketVision API..."
cd ../marketvision-api
npx eslint --fix src/ || echo "⚠️ Ошибки в MarketVision API (но импорты отсортированы)"

# Python проект
echo "🐍 Python проект..."
cd ../ozon-api
python3 -m isort src/ || echo "⚠️ Ошибки в Python проекте (но импорты отсортированы)"
python3 -m black src/ || echo "⚠️ Ошибки форматирования в Python проекте"

echo "✅ Сортировка импортов завершена!"
echo ""
echo "📝 Для исправления ошибок типизации запустите:"
echo "   npm run lint:fix" 