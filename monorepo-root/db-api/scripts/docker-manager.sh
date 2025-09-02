#!/bin/bash

# Упрощенный менеджер БД: только 2 операции
#  - update-schema: без потери данных, поднимает контейнеры и применяет миграции/схему
#  - reset-and-update: полный сброс volume, затем обновление схемы

set -euo pipefail

compose_db="docker-compose -f docker-compose.db.yml"
compose_all="docker-compose -f docker-compose.db.yml -f docker-compose.yml"
pg_container="marketvision-postgres"
api_container="marketvision-database-api"

wait_for_pg() {
  echo "⏳ Ожидание готовности PostgreSQL..."
  until docker exec ${pg_container} pg_isready -U marketvision -d marketvision >/dev/null 2>&1; do
    echo "PostgreSQL еще не готов..."
    sleep 2
  done
  echo "✅ PostgreSQL готов!"
}

ensure_up() {
  echo "🚀 Запуск контейнеров Postgres + db-api..."
  ${compose_all} up -d --build
  wait_for_pg
}

prisma_apply() {
  echo "🔄 Применение миграций (если есть)..."
  if ! docker exec ${api_container} npx prisma migrate deploy; then
    echo "⚠️  Миграции не найдены или не применены. Выполняю prisma db push..."
    docker exec ${api_container} npx prisma db push
  fi
  echo "🔧 Генерация Prisma Client..."
  docker exec ${api_container} npx prisma generate
}

case "${1:-}" in
  update-schema)
    echo "🔄 Обновление схемы БД без потери данных"
    ${compose_db} up -d
    ensure_up
    prisma_apply
    echo "📊 Статус контейнеров:"
    docker ps --filter "name=marketvision" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo "✅ Готово"
    ;;

  reset-and-update)
    echo "🧨 Полный сброс БД (volume) + обновление схемы"
    ${compose_all} down || true
    ${compose_db} down -v || true
    ${compose_db} up -d
    wait_for_pg
    ${compose_all} up -d --build
    # Пытаемся использовать reset, если есть миграции; иначе db push
    if docker exec ${api_container} sh -lc "test -d prisma/migrations && [ \"\$(ls -A prisma/migrations | wc -l)\" -gt 0 ]"; then
      echo "🔄 prisma migrate reset --force"
      docker exec -e FORCE_COLOR=1 ${api_container} npx prisma migrate reset --force --skip-seed || true
    fi
    prisma_apply
    echo "📊 Статус контейнеров:"
    docker ps --filter "name=marketvision" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo "✅ Готово"
    ;;

  *)
    echo "📋 Использование: $0 {update-schema|reset-and-update}"
    echo "  update-schema     - Поднять Postgres+API и обновить схему без потери данных"
    echo "  reset-and-update  - Полный сброс тома БД и обновление схемы"
    exit 1
    ;;
esac