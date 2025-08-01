#!/bin/bash

# 🚀 Скрипт для тестирования производительности MarketVision

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Функция для мониторинга ресурсов
monitor_resources() {
    local duration=$1
    local interval=$2
    
    print_status "📊 Мониторинг ресурсов в течение ${duration} секунд..."
    
    # Создаем временный файл для результатов
    local temp_file=$(mktemp)
    
    # Запускаем мониторинг в фоне
    (
        for ((i=0; i<duration; i+=interval)); do
            # CPU и RAM
            cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
            ram_usage=$(top -l 1 | grep "PhysMem" | awk '{print $2}' | sed 's/[A-Z]//g')
            
            # Docker контейнеры
            docker_stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "No containers")
            
            echo "$(date '+%H:%M:%S') | CPU: ${cpu_usage}% | RAM: ${ram_usage}MB | Docker: ${docker_stats}" >> "$temp_file"
            
            sleep $interval
        done
    ) &
    
    local monitor_pid=$!
    
    # Ждем завершения мониторинга
    wait $monitor_pid
    
    # Выводим результаты
    echo ""
    print_success "📈 Результаты мониторинга:"
    echo "=================================="
    cat "$temp_file"
    
    # Анализируем результаты
    analyze_results "$temp_file"
    
    # Очищаем временный файл
    rm "$temp_file"
}

# Функция для анализа результатов
analyze_results() {
    local file=$1
    
    print_status "🔍 Анализ результатов..."
    
    # Максимальное использование CPU
    max_cpu=$(grep -o "CPU: [0-9.]*%" "$file" | sed 's/CPU: //' | sed 's/%//' | sort -n | tail -1)
    
    # Максимальное использование RAM
    max_ram=$(grep -o "RAM: [0-9]*MB" "$file" | sed 's/RAM: //' | sed 's/MB//' | sort -n | tail -1)
    
    # Среднее использование CPU
    avg_cpu=$(grep -o "CPU: [0-9.]*%" "$file" | sed 's/CPU: //' | sed 's/%//' | awk '{sum+=$1} END {print sum/NR}')
    
    # Среднее использование RAM
    avg_ram=$(grep -o "RAM: [0-9]*MB" "$file" | sed 's/RAM: //' | sed 's/MB//' | awk '{sum+=$1} END {print sum/NR}')
    
    echo ""
    print_success "📊 Статистика использования ресурсов:"
    echo "=============================================="
    echo "🔥 Максимальное использование:"
    echo "   CPU: ${max_cpu}%"
    echo "   RAM: ${max_ram}MB"
    echo ""
    echo "📈 Среднее использование:"
    echo "   CPU: ${avg_cpu}%"
    echo "   RAM: ${avg_ram}MB"
    echo ""
    
    # Рекомендации по серверу
    recommend_server "$max_cpu" "$max_ram" "$avg_cpu" "$avg_ram"
}

# Функция для рекомендаций по серверу
recommend_server() {
    local max_cpu=$1
    local max_ram=$2
    local avg_cpu=$3
    local avg_ram=$4
    
    print_status "🎯 Рекомендации по серверу:"
    echo "================================="
    
    # Рекомендации по CPU
    if (( $(echo "$max_cpu > 80" | bc -l) )); then
        echo "🔥 CPU: Высокая нагрузка - нужны 4+ ядра"
        cpu_recommendation="High C4-M8-D80 (4 ядра)"
    elif (( $(echo "$max_cpu > 50" | bc -l) )); then
        echo "⚡ CPU: Средняя нагрузка - 2-4 ядра"
        cpu_recommendation="High C2-M4-D60 (2 ядра)"
    else
        echo "✅ CPU: Низкая нагрузка - 1-2 ядра достаточно"
        cpu_recommendation="High C1-M2-D20 (1 ядро)"
    fi
    
    # Рекомендации по RAM
    if (( max_ram > 6000 )); then
        echo "🔥 RAM: Высокая нагрузка - нужно 8+ ГБ"
        ram_recommendation="High C4-M8-D80 (8 ГБ)"
    elif (( max_ram > 3000 )); then
        echo "⚡ RAM: Средняя нагрузка - 4-8 ГБ"
        ram_recommendation="High C2-M4-D60 (4 ГБ)"
    else
        echo "✅ RAM: Низкая нагрузка - 2-4 ГБ достаточно"
        ram_recommendation="High C1-M2-D20 (2 ГБ)"
    fi
    
    echo ""
    echo "🏆 Итоговая рекомендация:"
    echo "   $cpu_recommendation или $ram_recommendation"
}

# Функция для тестирования нагрузки
test_load() {
    local test_type=$1
    
    print_status "🧪 Запуск теста нагрузки: $test_type"
    
    case $test_type in
        "parsing")
            test_parsing_load
            ;;
        "api")
            test_api_load
            ;;
        "full")
            test_full_load
            ;;
        *)
            print_error "Неизвестный тип теста: $test_type"
            exit 1
            ;;
    esac
}

# Тест нагрузки парсинга
test_parsing_load() {
    print_status "🔍 Тестируем нагрузку парсинга..."
    
    # Запускаем несколько запросов одновременно
    for i in {1..5}; do
        (
            print_status "Запрос $i: Парсинг Ozon..."
            curl -s "http://localhost:3002/health" > /dev/null &
        ) &
    done
    
    # Ждем завершения
    wait
    
    print_success "✅ Тест парсинга завершен"
}

# Тест нагрузки API
test_api_load() {
    print_status "🌐 Тестируем нагрузку API..."
    
    # Запускаем несколько запросов к API
    for i in {1..10}; do
        (
            print_status "Запрос $i: API запрос..."
            curl -s "http://localhost:3003/health" > /dev/null &
            curl -s "http://localhost:3001/health" > /dev/null &
        ) &
    done
    
    # Ждем завершения
    wait
    
    print_success "✅ Тест API завершен"
}

# Полный тест нагрузки
test_full_load() {
    print_status "🚀 Запускаем полный тест нагрузки..."
    
    # Запускаем все тесты одновременно
    test_parsing_load &
    test_api_load &
    
    # Ждем завершения
    wait
    
    print_success "✅ Полный тест завершен"
}

# Функция для запуска всех сервисов
start_all_services() {
    print_status "🚀 Запускаем все сервисы для тестирования..."
    
    # Запускаем все docker-compose файлы
    local compose_files=(
        "docker-compose.ozon.yml"
        "docker-compose.db.yml"
        "docker-compose.product-filter.yml"
        "docker-compose.wb-api.yml"
        "docker-compose.marketvision.yml"
    )
    
    for file in "${compose_files[@]}"; do
        if [ -f "../$file" ]; then
            print_status "📁 Запускаем $file..."
            docker-compose -f "../$file" up -d
        fi
    done
    
    # Ждем запуска сервисов (особенно PostgreSQL)
    print_status "⏳ Ждем запуска сервисов..."
    print_status "   PostgreSQL может занять 30-60 секунд..."
    sleep 45
    
    # Проверяем, что PostgreSQL запустился
    print_status "🔍 Проверяем PostgreSQL..."
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec postgres pg_isready -U user -d marketvision > /dev/null 2>&1; then
            print_success "✅ PostgreSQL готов к работе"
            break
        else
            print_status "   Попытка $attempt/$max_attempts: PostgreSQL еще не готов..."
            sleep 10
            attempt=$((attempt + 1))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_warning "⚠️ PostgreSQL не запустился за ожидаемое время"
    fi
    
    print_success "✅ Все сервисы запущены"
}

# Функция для остановки всех сервисов
stop_all_services() {
    print_status "🛑 Останавливаем все сервисы..."
    
    local compose_files=(
        "docker-compose.ozon.yml"
        "docker-compose.db.yml"
        "docker-compose.product-filter.yml"
        "docker-compose.wb-api.yml"
        "docker-compose.marketvision.yml"
    )
    
    for file in "${compose_files[@]}"; do
        if [ -f "../$file" ]; then
            docker-compose -f "../$file" down
        fi
    done
    
    print_success "✅ Все сервисы остановлены"
}

# Основная логика
case "${1:-}" in
    "start")
        start_all_services
        ;;
    "stop")
        stop_all_services
        ;;
    "monitor")
        monitor_resources "${2:-60}" "${3:-5}"
        ;;
    "test")
        test_load "${2:-full}"
        ;;
    "full-test")
        start_all_services
        sleep 10
        test_load "full"
        monitor_resources 120 10
        stop_all_services
        ;;
    *)
        echo "🚀 Скрипт для тестирования производительности MarketVision"
        echo ""
        echo "Использование: $0 [команда] [опции]"
        echo ""
        echo "Команды:"
        echo "  start                    - Запустить все сервисы"
        echo "  stop                     - Остановить все сервисы"
        echo "  monitor [сек] [интервал] - Мониторинг ресурсов"
        echo "  test [тип]               - Тест нагрузки (parsing/api/full)"
        echo "  full-test                - Полный тест с мониторингом"
        echo ""
        echo "Примеры:"
        echo "  $0 start                 # Запустить все сервисы"
        echo "  $0 monitor 60 5          # Мониторинг 60 сек, каждые 5 сек"
        echo "  $0 test parsing          # Тест парсинга"
        echo "  $0 full-test             # Полный тест"
        ;;
esac 