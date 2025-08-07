#!/bin/bash

# Устанавливаем переменные окружения для Chrome
export DISPLAY=:99
export CHROME_BIN=/usr/bin/google-chrome
export CHROMEDRIVER_PATH=/usr/local/bin/chromedriver

# Проверяем наличие Chrome
echo "🔍 Проверка Chrome..."
if command -v google-chrome &> /dev/null; then
    echo "✅ Chrome найден: $(google-chrome --version)"
else
    echo "❌ Chrome не найден!"
    exit 1
fi

# Проверяем наличие ChromeDriver
echo "🔍 Проверка ChromeDriver..."
if command -v chromedriver &> /dev/null; then
    echo "✅ ChromeDriver найден: $(chromedriver --version)"
else
    echo "❌ ChromeDriver не найден!"
    exit 1
fi

# Запускаем виртуальный экран
echo "🖥️ Запуск виртуального экрана..."
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset > /dev/null 2>&1 &
XVFB_PID=$!

# Ждем инициализации экрана
sleep 3

# Проверяем что Xvfb запустился
if ! kill -0 $XVFB_PID 2>/dev/null; then
    echo "❌ Ошибка запуска виртуального экрана"
    exit 1
fi

# Запускаем оконный менеджер
echo "🪟 Запуск оконного менеджера..."
fluxbox > /dev/null 2>&1 &
FLUXBOX_PID=$!

# Ждем инициализации оконного менеджера
sleep 2

# Проверяем что fluxbox запустился
if ! kill -0 $FLUXBOX_PID 2>/dev/null; then
    echo "❌ Ошибка запуска оконного менеджера"
    exit 1
fi

echo "✅ Виртуальный экран готов"
echo "🔧 Запуск Ozon API..."

# Запускаем основное приложение
exec python src/main.py 