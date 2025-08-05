#!/bin/bash

# Скрипт для восстановления базы данных MarketVision из бэкапа

# Настройки
DB_NAME="marketvision"
DB_USER="marketvision"
BACKUP_DIR="/backups"

echo "🔄 Восстановление базы данных MarketVision..."

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo "❌ Укажите файл бэкапа!"
    echo "Использование: $0 <backup_file>"
    echo ""
    echo "Доступные бэкапы:"
    ls -lh ${BACKUP_DIR}/marketvision_backup_*.sql 2>/dev/null || echo "Бэкапы не найдены"
    exit 1
fi

BACKUP_FILE=$1

# Проверяем существование файла
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ] && [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}.gz" ]; then
    echo "❌ Файл бэкапа не найден: ${BACKUP_FILE}"
    echo "Доступные бэкапы:"
    echo "   Сжатые (полные):"
    ls -lh ${BACKUP_DIR}/marketvision_backup_*.gz 2>/dev/null || echo "   Сжатые бэкапы не найдены"
    echo "   SQL (последние 7 дней):"
    ls -lh ${BACKUP_DIR}/marketvision_backup_*.sql 2>/dev/null || echo "   SQL бэкапы не найдены"
    exit 1
fi

# Проверяем, что контейнер запущен
if ! docker ps | grep -q marketvision-postgres; then
    echo "❌ Контейнер PostgreSQL не запущен!"
    exit 1
fi

echo "⚠️  ВНИМАНИЕ: Это действие перезапишет текущую базу данных!"
echo "Файл бэкапа: ${BACKUP_FILE}"
read -p "Продолжить? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Восстановление отменено"
    exit 1
fi

echo "🔄 Восстановление из бэкапа: ${BACKUP_FILE}"

# Останавливаем API для безопасности
echo "🛑 Остановка API..."
docker stop marketvision-database-api 2>/dev/null || true

# Определяем тип бэкапа и восстанавливаем
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}.gz" ]; then
    echo "📦 Восстановление из сжатого бэкапа..."
    gunzip -c ${BACKUP_DIR}/${BACKUP_FILE}.gz | docker exec -i marketvision-postgres psql -U ${DB_USER} -d ${DB_NAME}
elif [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "📦 Восстановление из SQL бэкапа..."
    docker exec -i marketvision-postgres psql -U ${DB_USER} -d ${DB_NAME} < ${BACKUP_DIR}/${BACKUP_FILE}
else
    echo "❌ Файл бэкапа не найден!"
    exit 1
fi

# Проверяем успешность
if [ $? -eq 0 ]; then
    echo "✅ База данных успешно восстановлена!"
    
    # Запускаем API обратно
    echo "🚀 Запуск API..."
    docker start marketvision-database-api
    
    echo "🎉 Восстановление завершено успешно!"
else
    echo "❌ Ошибка восстановления!"
    echo "🚀 Запуск API..."
    docker start marketvision-database-api
    exit 1
fi 