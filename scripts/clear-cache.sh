#!/bin/bash

# Скрипт для очистки кэша после парсинга
echo "🧹 Очистка кэша после парсинга..."

# Очищаем кэш через API (внешний доступ)
curl -X POST http://localhost/api/cache/clear \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

# Также очищаем кэш через внутреннюю сеть Docker (для автоматизации)
docker exec marketvision-nginx-1 curl -X POST http://localhost/api/cache/clear \
  -H "Content-Type: application/json" \
  -w "\nInternal HTTP Status: %{http_code}\n" 2>/dev/null || echo "⚠️ Не удалось очистить кэш через Docker"

echo "✅ Кэш очищен"
