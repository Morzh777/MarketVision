#!/bin/bash

# ⚡ Быстрый тест производительности MarketVision

echo "🚀 Быстрый тест производительности MarketVision"
echo "================================================"

# Проверяем, запущены ли сервисы
echo "🔍 Проверяем статус сервисов..."

# Ozon API
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Ozon API запущен"
    ozon_running=true
else
    echo "❌ Ozon API не запущен"
    ozon_running=false
fi

# DB API
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ DB API запущен"
    db_running=true
else
    echo "❌ DB API не запущен"
    db_running=false
fi

# PostgreSQL
if docker exec postgres pg_isready -U user -d marketvision > /dev/null 2>&1; then
    echo "✅ PostgreSQL запущен"
    postgres_running=true
else
    echo "❌ PostgreSQL не запущен"
    postgres_running=false
fi

echo ""
if [ "$ozon_running" = false ] || [ "$db_running" = false ] || [ "$postgres_running" = false ]; then
    echo "💡 Для запуска сервисов используйте:"
    echo "   docker-compose -f docker-compose.ozon.yml up -d"
    echo "   docker-compose -f docker-compose.db.yml up -d"
    echo ""
    echo "⚠️ Тест будет проведен только для запущенных сервисов"
fi

echo ""
echo "📊 Текущее использование ресурсов:"
echo "=================================="

# CPU и RAM
cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
ram_usage=$(top -l 1 | grep "PhysMem" | awk '{print $2}' | sed 's/[A-Z]//g')

echo "💻 CPU: ${cpu_usage}%"
echo "🧠 RAM: ${ram_usage}MB"

echo ""
echo "🐳 Docker контейнеры:"
echo "===================="

# Статистика Docker контейнеров
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "Нет запущенных контейнеров"

echo ""
echo "🧪 Тестируем нагрузку..."
echo "========================"

# Тест 1: Простой запрос к health endpoint
echo "1️⃣ Тест health endpoint..."
if [ "$ozon_running" = true ]; then
    start_time=$(date +%s.%N)
    curl -s http://localhost:3005/health > /dev/null
    end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc)
    echo "   ⏱️ Ozon API время ответа: ${response_time} секунд"
fi

if [ "$db_running" = true ]; then
    start_time=$(date +%s.%N)
    curl -s http://localhost:3003/health > /dev/null
    end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc)
    echo "   ⏱️ DB API время ответа: ${response_time} секунд"
fi

# Тест 2: Несколько запросов одновременно
echo "2️⃣ Тест параллельных запросов..."
start_time=$(date +%s.%N)
if [ "$ozon_running" = true ]; then
    for i in {1..3}; do
        curl -s http://localhost:3005/health > /dev/null &
    done
fi

if [ "$db_running" = true ]; then
    for i in {1..3}; do
        curl -s http://localhost:3003/health > /dev/null &
    done
fi
wait
end_time=$(date +%s.%N)
total_time=$(echo "$end_time - $start_time" | bc)
echo "   ⏱️ Время 6 запросов: ${total_time} секунд"

echo ""
echo "📈 Результаты анализа:"
echo "======================"

# Анализ CPU
if (( $(echo "$cpu_usage > 80" | bc -l) )); then
    echo "🔥 CPU: Высокая нагрузка - нужны 4+ ядра"
    cpu_recommendation="High C4-M8-D80"
elif (( $(echo "$cpu_usage > 50" | bc -l) )); then
    echo "⚡ CPU: Средняя нагрузка - 2-4 ядра"
    cpu_recommendation="High C2-M4-D60"
else
    echo "✅ CPU: Низкая нагрузка - 1-2 ядра достаточно"
    cpu_recommendation="High C1-M2-D20"
fi

# Анализ RAM
if (( ram_usage > 6000 )); then
    echo "🔥 RAM: Высокая нагрузка - нужно 8+ ГБ"
    ram_recommendation="High C4-M8-D80"
elif (( ram_usage > 3000 )); then
    echo "⚡ RAM: Средняя нагрузка - 4-8 ГБ"
    ram_recommendation="High C2-M4-D60"
else
    echo "✅ RAM: Низкая нагрузка - 2-4 ГБ достаточно"
    ram_recommendation="High C1-M2-D20"
fi

echo ""
echo "🏆 Рекомендация по серверу:"
echo "==========================="
echo "   $cpu_recommendation или $ram_recommendation"

echo ""
echo "💡 Дополнительные тесты:"
echo "========================"
echo "   ./scripts/performance_test.sh full-test  # Полный тест с мониторингом"
echo "   ./scripts/performance_test.sh monitor 60 5  # Мониторинг 60 сек" 