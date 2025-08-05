#!/bin/bash

# Скрипт для восстановления системы

# Настройки
DB_NAME="marketvision"
DB_USER="marketvision"
BACKUP_DIR="./backups"

echo "🚨 DISASTER RECOVERY - Восстановление MarketVision"
echo "=================================================="

# Функция для поиска последнего бэкапа
find_latest_backup() {
    local latest_gz=$(ls -t ${BACKUP_DIR}/marketvision_backup_*.gz 2>/dev/null | head -1)
    local latest_sql=$(ls -t ${BACKUP_DIR}/marketvision_backup_*.sql 2>/dev/null | head -1)
    
    # Определяем какой бэкап новее
    if [ -n "$latest_gz" ] && [ -n "$latest_sql" ]; then
        if [ "$latest_gz" -nt "$latest_sql" ]; then
            echo "$latest_gz"
        else
            echo "$latest_sql"
        fi
    elif [ -n "$latest_gz" ]; then
        echo "$latest_gz"
    elif [ -n "$latest_sql" ]; then
        echo "$latest_sql"
    else
        echo ""
    fi
}

# Ищем последний бэкап
LATEST_BACKUP=$(find_latest_backup)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ Бэкапы не найдены в ${BACKUP_DIR}/"
    echo ""
    echo "Доступные бэкапы:"
    ls -lh ${BACKUP_DIR}/marketvision_backup_* 2>/dev/null || echo "   Бэкапы не найдены"
    exit 1
fi

# Извлекаем имя файла без пути
BACKUP_FILE=$(basename "$LATEST_BACKUP")
BACKUP_FILE_NO_EXT="${BACKUP_FILE%.gz}"
BACKUP_FILE_NO_EXT="${BACKUP_FILE_NO_EXT%.sql}"

echo "📦 Найден последний бэкап: ${BACKUP_FILE}"
echo "📊 Размер: $(ls -lh "$LATEST_BACKUP" | awk '{print $5}')"
echo "📅 Дата: $(ls -lh "$LATEST_BACKUP" | awk '{print $6, $7, $8}')"

echo ""
echo "⚠️  ВНИМАНИЕ: Это восстановление системы!"
echo "Это действие:"
echo "  1. Остановит все контейнеры"
echo "  2. Сохранит данные PostgreSQL (volume не удаляется)"
echo "  3. Восстановит из бэкапа: ${BACKUP_FILE}"
echo "  4. Перезапустит все сервисы"
read -p "Продолжить? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Восстановление отменено"
    exit 1
fi

echo "🔄 Начинаем восстановление..."

# Шаг 1: Останавливаем все контейнеры
echo "🛑 Шаг 1: Остановка всех контейнеров..."
./scripts/docker-manager.sh stop-all

cd ../ozon-api
docker-compose down 2>/dev/null || true

cd ../wb-api
docker-compose down 2>/dev/null || true

cd ../product-filter-service
docker-compose down 2>/dev/null || true

echo "✅ Все контейнеры остановлены"

# Шаг 2: Останавливаем PostgreSQL (данные сохраняются в volume)
echo "💾 Шаг 2: Остановка PostgreSQL (данные сохраняются)..."
docker-compose -f docker-compose.db.yml down
echo "✅ Данные PostgreSQL сохранены в volume"

# Шаг 3: Запускаем PostgreSQL заново
echo "🗄️ Шаг 3: Запуск PostgreSQL..."
./scripts/docker-manager.sh start-db
echo "✅ PostgreSQL запущен"

# Шаг 4: Ждем готовности PostgreSQL
echo "⏳ Шаг 4: Ожидание готовности PostgreSQL..."
sleep 5

# Ждем пока контейнер запустится
echo "⏳ Ожидание запуска контейнера..."
until docker ps --filter "name=marketvision-postgres" --format "{{.Status}}" | grep -q "Up"; do
    echo "Контейнер PostgreSQL еще не запущен..."
    sleep 3
done

# Ждем готовности PostgreSQL внутри контейнера
echo "⏳ Ожидание готовности PostgreSQL..."
until docker exec marketvision-postgres pg_isready -U marketvision -d marketvision >/dev/null 2>&1; do
    echo "PostgreSQL еще не готов..."
    sleep 3
done
echo "✅ PostgreSQL готов!"

# Шаг 5: Восстанавливаем из бэкапа
echo "📦 Шаг 5: Восстановление из бэкапа..."
if [[ "$LATEST_BACKUP" == *.gz ]]; then
    echo "📦 Восстановление из сжатого бэкапа..."
    gunzip -c "$LATEST_BACKUP" | docker exec -i marketvision-postgres psql -U ${DB_USER} -d ${DB_NAME}
else
    echo "📦 Восстановление из SQL бэкапа..."
    docker exec -i marketvision-postgres psql -U ${DB_USER} -d ${DB_NAME} < "$LATEST_BACKUP"
fi

if [ $? -ne 0 ]; then
    echo "❌ Ошибка восстановления!"
    exit 1
fi
echo "✅ База данных восстановлена"

# Шаг 6: Запускаем Database API
echo "🚀 Шаг 6: Запуск Database API..."
./scripts/docker-manager.sh start-api
echo "✅ Database API запущен"

# Шаг 7: Запускаем остальные сервисы
echo "🚀 Шаг 7: Запуск остальных сервисов..."

cd ../ozon-api
docker-compose up -d
echo "✅ Ozon API запущен"

cd ../wb-api
docker-compose up -d
echo "✅ WB API запущен"

cd ../product-filter-service
docker-compose up -d
echo "✅ Product Filter Service запущен"

# Шаг 8: Проверяем статус
echo "📊 Шаг 8: Проверка статуса..."
./scripts/docker-manager.sh status

echo ""
echo "🎉 ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО!"
echo "=================================================="
echo "✅ Все сервисы запущены"
echo "✅ База данных восстановлена из: ${BACKUP_FILE}"
echo "✅ Данные PostgreSQL сохранены в volume"
echo "✅ Система готова к работе"
echo ""
echo "Проверьте логи сервисов:"
echo "  ./scripts/docker-manager.sh logs-api"
echo "  docker logs -f marketvision-ozon-parser"
echo "  docker logs -f marketvision-wb-api" 