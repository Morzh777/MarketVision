#!/bin/bash

# 🚀 Скрипт для быстрого обновления контейнеров при разработке

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверяем, что docker-compose установлен
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose не установлен"
    exit 1
fi

# Функция для обновления конкретного сервиса
update_service() {
    local service=$1
    local compose_file=$2
    
    print_status "🔄 Обновляем $service..."
    
    # Останавливаем сервис
    docker-compose -f $compose_file stop $service 2>/dev/null || true
    
    # Удаляем старый контейнер
    docker-compose -f $compose_file rm -f $service 2>/dev/null || true
    
    # Пересобираем и запускаем
    docker-compose -f $compose_file up -d --build $service
    
    print_success "✅ $service обновлен и запущен"
}

# Функция для обновления всех сервисов
update_all() {
    print_status "🚀 Обновляем все сервисы..."
    
    # Список всех docker-compose файлов
    local compose_files=(
        "docker-compose.ozon.yml"
        "docker-compose.db.yml"
        "docker-compose.product-filter.yml"
        "docker-compose.wb-api.yml"
        "docker-compose.marketvision.yml"
    )
    
    for file in "${compose_files[@]}"; do
        if [ -f "$file" ]; then
            print_status "📁 Обрабатываем $file"
            docker-compose -f $file down
            docker-compose -f $file up -d --build
        fi
    done
    
    print_success "✅ Все сервисы обновлены"
}

# Функция для показа статуса
show_status() {
    print_status "📊 Статус контейнеров:"
    
    local compose_files=(
        "docker-compose.ozon.yml:Ozon API"
        "docker-compose.db.yml:DB API"
        "docker-compose.product-filter.yml:Product Filter"
        "docker-compose.wb-api.yml:WB API"
        "docker-compose.marketvision.yml:MarketVision"
    )
    
    for file_info in "${compose_files[@]}"; do
        IFS=':' read -r file name <<< "$file_info"
        if [ -f "$file" ]; then
            echo ""
            print_status "$name:"
            docker-compose -f $file ps
        fi
    done
}

# Функция для показа логов
show_logs() {
    local service=$1
    local compose_file=$2
    
    if [ -z "$service" ]; then
        print_error "Укажите сервис для просмотра логов"
        echo "Доступные сервисы: ozon-api, db-api, product-filter-service, wb-api, marketvision-api"
        exit 1
    fi
    
    print_status "📋 Показываем логи для $service..."
    docker-compose -f $compose_file logs -f $service
}

# Парсинг аргументов
case "${1:-}" in
    "ozon")
        update_service "ozon-api" "docker-compose.ozon.yml"
        ;;
    "db")
        update_service "db-api" "docker-compose.db.yml"
        ;;
    "product-filter")
        update_service "product-filter-service" "docker-compose.product-filter.yml"
        ;;
    "wb")
        update_service "wb-api" "docker-compose.wb-api.yml"
        ;;
    "marketvision")
        update_service "marketvision-api" "docker-compose.marketvision.yml"
        ;;
    "all")
        update_all
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2" "$3"
        ;;
    "watchtower")
        print_status "🔍 Запускаем Watchtower для автоматического обновления..."
        docker-compose -f docker-compose.watchtower.yml up -d
        print_success "✅ Watchtower запущен"
        ;;
    *)
        echo "🚀 Скрипт для обновления Docker контейнеров"
        echo ""
        echo "Использование: $0 [команда] [опции]"
        echo ""
        echo "Команды:"
        echo "  ozon              - Обновить Ozon API"
        echo "  db                - Обновить DB API"
        echo "  product-filter    - Обновить Product Filter Service"
        echo "  wb                - Обновить WB API"
        echo "  marketvision      - Обновить MarketVision API"
        echo "  all               - Обновить все сервисы"
        echo "  status            - Показать статус всех контейнеров"
        echo "  logs <service> <file> - Показать логи сервиса"
        echo "  watchtower        - Запустить Watchtower для автообновления"
        echo ""
        echo "Примеры:"
        echo "  $0 ozon                    # Обновить только Ozon API"
        echo "  $0 logs ozon-api docker-compose.ozon.yml  # Логи Ozon API"
        echo "  $0 all                     # Обновить все сервисы"
        ;;
esac 