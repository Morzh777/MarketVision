#!/bin/bash

# Скрипт для создания бэкапа базы данных MarketVision

# Настройки
DB_NAME="marketvision"
DB_USER="marketvision"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="marketvision_backup_${DATE}.sql"

echo "🗄️ Создание бэкапа базы данных MarketVision..."

# Создаем папку для бэкапов, если её нет
mkdir -p ${BACKUP_DIR}

# Проверяем, что контейнер запущен
if ! docker ps | grep -q marketvision-postgres; then
    echo "❌ Контейнер PostgreSQL не запущен!"
    exit 1
fi

# Создаем бэкап (сжатый и оптимизированный)
echo "📦 Создание бэкапа: ${BACKUP_FILE}.gz"
docker exec marketvision-postgres pg_dump -U ${DB_USER} ${DB_NAME} | gzip > ${BACKUP_DIR}/${BACKUP_FILE}.gz

# Создаем также SQL версию для совместимости (полные данные)
echo "📦 Создание SQL бэкапа (полные данные): ${BACKUP_FILE}"
docker exec marketvision-postgres pg_dump -U ${DB_USER} ${DB_NAME} > ${BACKUP_DIR}/${BACKUP_FILE}

# Проверяем успешность
if [ $? -eq 0 ]; then
    echo "✅ Бэкапы успешно созданы!"
    
    # Показываем размеры файлов
    GZ_SIZE=$(du -h ${BACKUP_DIR}/${BACKUP_FILE}.gz | cut -f1)
    SQL_SIZE=$(du -h ${BACKUP_DIR}/${BACKUP_FILE} | cut -f1)
    echo "📊 Размеры бэкапов:"
    echo "   - Полный (сжатый): ${GZ_SIZE} (${BACKUP_FILE}.gz)"
    echo "   - Полный (SQL): ${SQL_SIZE} (${BACKUP_FILE})"
    
    # Удаляем старые бэкапы (оставляем последние 5)
    echo "🧹 Очистка старых бэкапов..."
    cd ${BACKUP_DIR}
    ls -t marketvision_backup_*.gz | tail -n +6 | xargs -r rm
    ls -t marketvision_backup_*.sql | tail -n +6 | xargs -r rm
    echo "✅ Старые бэкапы удалены"
    
    # Показываем список бэкапов
    echo "📋 Список доступных бэкапов:"
    echo "   Сжатые (полные):"
    ls -lh ${BACKUP_DIR}/marketvision_backup_*.gz 2>/dev/null || echo "   Сжатые бэкапы не найдены"
    echo "   SQL (полные данные):"
    ls -lh ${BACKUP_DIR}/marketvision_backup_*.sql 2>/dev/null || echo "   SQL бэкапы не найдены"
    
else
    echo "❌ Ошибка создания бэкапа!"
    exit 1
fi

echo "🎉 Бэкап завершен успешно!" 