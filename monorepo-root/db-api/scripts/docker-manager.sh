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
    docker-compose -f docker-compose.db.yml -f docker-compose.yml up -d --build
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
    
  "backup")
    echo "🗄️ Создание бэкапа базы данных..."
    ./scripts/backup.sh
    ;;
    
  "list-backups")
    echo "📋 Список бэкапов:"
    ls -lh backups/marketvision_backup_*.sql 2>/dev/null || echo "Бэкапы не найдены"
    ;;
    
  "restore")
    if [ -z "$2" ]; then
      echo "❌ Укажите файл бэкапа!"
      echo "Использование: $0 restore <backup_file>"
      echo ""
      echo "Доступные бэкапы:"
      echo "   Сжатые (полные):"
      ls -lh backups/marketvision_backup_*.gz 2>/dev/null || echo "   Сжатые бэкапы не найдены"
      echo "   SQL (последние 7 дней):"
      ls -lh backups/marketvision_backup_*.sql 2>/dev/null || echo "   SQL бэкапы не найдены"
      exit 1
    fi
    echo "🔄 Восстановление из бэкапа: $2"
    ./scripts/restore.sh "$2"
    ;;
    
  "disaster-recovery")
    echo "🚨 Полное восстановление системы из последнего бэкапа"
    ./scripts/disaster-recovery.sh
    ;;
    
  "update-schema")
    echo "🔄 Безопасное обновление схемы базы данных..."
    echo "⚠️  ВНИМАНИЕ: Это обновит схему БД без потери данных!"
    echo "   - Применит новые миграции"
    echo "   - Пересоберет API с новой схемой"
    echo "   - Сохранит все существующие данные"
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Обновление отменено"
      exit 1
    fi
    
    echo "🔄 Шаг 1: Синхронизация схемы с базой данных..."
    docker exec marketvision-database-api npx prisma db push
    
    echo "🔄 Шаг 2: Создание миграции на основе изменений..."
    docker exec marketvision-database-api npx prisma migrate dev --name schema_update_$(date +%Y%m%d_%H%M%S) --create-only
    
    echo "🔄 Шаг 3: Применение миграции..."
    docker exec marketvision-database-api npx prisma migrate deploy
    
    echo "🔄 Шаг 4: Генерация Prisma Client..."
    docker exec marketvision-database-api npx prisma generate
    
    echo "🔄 Шаг 5: Пересборка API с новой схемой..."
    ./scripts/docker-manager.sh start-api
    
    echo "✅ Схема базы данных успешно обновлена!"
    echo "✅ API пересобран с новой схемой!"
    echo "✅ Все данные сохранены!"
    ;;
    
  *)
    echo "📋 Использование: $0 {start-db|stop-db|init-db|reset-db|start-api|stop-api|start-all|stop-all|logs-api|logs-db|status|backup|list-backups|restore <file>|disaster-recovery|update-schema}"
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
    echo "  backup      - Создать бэкап базы данных"
    echo "  list-backups - Показать список бэкапов"
    echo "  restore <file> - Восстановить из бэкапа"
    echo "  disaster-recovery - ПОЛНОЕ восстановление из последнего бэкапа"
    echo "  update-schema - Безопасное обновление схемы БД без потери данных"
    ;;
esac 