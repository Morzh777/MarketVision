#!/bin/bash

# Скрипт для управления контейнерами db-api

case "$1" in
  "start-db")
    echo "🗄️ Запуск PostgreSQL базы данных..."
    docker-compose -f docker-compose.db.yml up -d
    echo "✅ База данных запущена"
    ;;
    
  "start-db-full")
    echo "🗄️ Запуск PostgreSQL с полной инициализацией..."
    docker-compose -f docker-compose.db.yml up -d
    echo "✅ База данных запущена"
    echo "⏳ Ожидание готовности PostgreSQL..."
    sleep 5
    until docker exec marketvision-postgres pg_isready -U marketvision -d marketvision; do
      echo "PostgreSQL еще не готов..."
      sleep 2
    done
    echo "✅ PostgreSQL готов!"
    echo "🚀 Запуск API для применения миграций..."
    docker-compose -f docker-compose.db.yml -f docker-compose.yml up -d
    echo "⏳ Ожидание запуска API..."
    sleep 10
    echo "🔄 Применение миграций..."
    docker exec marketvision-database-api npx prisma migrate deploy
    echo "🔧 Генерация Prisma Client..."
    docker exec marketvision-database-api npx prisma generate
    echo "✅ База данных полностью инициализирована!"
    ;;
    
  "stop-db")
    echo "🛑 Остановка PostgreSQL базы данных..."
    docker-compose -f docker-compose.db.yml down
    echo "✅ База данных остановлена"
    ;;
    
  "init-db")
    echo "🗄️ Инициализация базы данных..."
    echo "⏳ Ожидание PostgreSQL..."
    until docker exec marketvision-postgres pg_isready -U marketvision -d marketvision; do
      echo "PostgreSQL еще не готов..."
      sleep 2
    done
    echo "✅ PostgreSQL готов!"
    echo "🔄 Применение миграций..."
    docker exec marketvision-database-api npx prisma migrate deploy
    echo "🔧 Генерация Prisma Client..."
    docker exec marketvision-database-api npx prisma generate
    echo "✅ База данных инициализирована!"
    ;;
    
  "reset-db")
    echo "🔄 Сброс базы данных..."
    docker-compose -f docker-compose.db.yml down -v
    docker-compose -f docker-compose.db.yml up -d
    sleep 5
    echo "🗄️ Инициализация новой базы..."
    $0 init-db
    ;;
    
  "start-api")
    echo "🚀 Запуск Database API..."
    docker-compose -f docker-compose.db.yml -f docker-compose.yml up -d
    echo "✅ API запущен"
    ;;
    
  "stop-api")
    echo "🛑 Остановка Database API..."
    docker-compose -f docker-compose.db.yml -f docker-compose.yml down
    echo "✅ API остановлен"
    ;;
    
  "start-all")
    echo "🚀 Запуск всех сервисов..."
    docker-compose -f docker-compose.db.yml -f docker-compose.yml up -d
    echo "✅ Все сервисы запущены"
    ;;
    
  "stop-all")
    echo "🛑 Остановка всех сервисов..."
    docker-compose -f docker-compose.db.yml -f docker-compose.yml down
    echo "✅ Все сервисы остановлены"
    ;;
    
  "logs-api")
    docker-compose -f docker-compose.db.yml -f docker-compose.yml logs -f
    ;;
    
  "logs-db")
    docker-compose -f docker-compose.db.yml logs -f
    ;;
    
  "status")
    echo "📊 Статус контейнеров:"
    docker ps --filter "name=marketvision" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    ;;
    
  *)
    echo "📋 Использование: $0 {start-db|stop-db|init-db|reset-db|start-api|stop-api|start-all|stop-all|logs-api|logs-db|status}"
    echo ""
    echo "Команды:"
    echo "  start-db    - Запустить только PostgreSQL"
    echo "  stop-db     - Остановить только PostgreSQL"
    echo "  init-db     - Инициализировать базу (миграции + Prisma Client)"
    echo "  reset-db    - Полный сброс базы (удалить данные + пересоздать)"
    echo "  start-api   - Запустить только API (нужна база)"
    echo "  stop-api    - Остановить только API"
    echo "  start-all   - Запустить базу + API"
    echo "  stop-all    - Остановить все"
    echo "  logs-api    - Логи API"
    echo "  logs-db     - Логи базы данных"
    echo "  status      - Статус контейнеров"
    ;;
esac 