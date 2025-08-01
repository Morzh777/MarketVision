#!/bin/bash

# Оптимизированная сборка Docker образа для Ozon API
set -e

echo "🚀 Начинаем оптимизированную сборку Ozon API..."

# Включаем BuildKit для лучшей производительности
export DOCKER_BUILDKIT=1

# Параметры сборки
IMAGE_NAME="ozon-api"
TAG="latest"
PLATFORM="linux/amd64,linux/arm64"  # Поддержка разных архитектур

# Очистка старых образов (опционально)
if [ "$1" = "--clean" ]; then
    echo "🧹 Очистка старых образов..."
    docker system prune -f
fi

# Сборка с оптимизациями
echo "🔨 Сборка образа с BuildKit..."
docker build \
    --platform $PLATFORM \
    --progress=plain \
    --no-cache \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    -t $IMAGE_NAME:$TAG \
    .

# Проверка размера образа
echo "📊 Размер образа:"
docker images $IMAGE_NAME:$TAG --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Оптимизация образа (опционально)
if command -v docker-slim &> /dev/null; then
    echo "🎯 Оптимизация образа с docker-slim..."
    docker-slim build --target $IMAGE_NAME:$TAG --tag $IMAGE_NAME:slim
fi

echo "✅ Сборка завершена успешно!"
echo "🐳 Запуск: docker run -p 3002:3002 -p 3005:3005 $IMAGE_NAME:$TAG" 