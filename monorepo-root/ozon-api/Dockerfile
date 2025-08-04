# Многоэтапная сборка для оптимизации
# Этап 1: Сборка зависимостей
FROM python:3.11-slim AS builder

# Устанавливаем системные зависимости для сборки
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Создаем виртуальное окружение
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Копируем файлы зависимостей
COPY requirements.txt pyproject.toml ./

# Устанавливаем зависимости в виртуальное окружение с кэшированием
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Этап 2: Финальный образ
FROM python:3.11-slim AS production

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем виртуальное окружение из builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Устанавливаем только runtime зависимости
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    x11vnc \
    fluxbox \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем Chrome и ChromeDriver (оптимизированная версия)
RUN if [ "$(uname -m)" = "aarch64" ]; then \
        # Для ARM64 используем Chromium
        apt-get update && apt-get install -y chromium chromium-driver \
        && ln -s /usr/bin/chromium /usr/bin/google-chrome \
        && ln -s /usr/bin/chromedriver /usr/local/bin/chromedriver \
        && rm -rf /var/lib/apt/lists/*; \
    else \
        # Для AMD64 используем Google Chrome
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
        && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
        && apt-get update \
        && apt-get install -y google-chrome-stable \
        && rm -rf /var/lib/apt/lists/* \
        && CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | awk -F'.' '{print $1}') \
        && wget -q "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION}" -O /tmp/chromedriver_version \
        && CHROMEDRIVER_VERSION=$(cat /tmp/chromedriver_version) \
        && wget -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" -O /tmp/chromedriver.zip \
        && unzip /tmp/chromedriver.zip -d /usr/local/bin/ \
        && rm /tmp/chromedriver.zip /tmp/chromedriver_version \
        && chmod +x /usr/local/bin/chromedriver; \
    fi

# Копируем proto файлы
COPY proto/ ./proto/

# Копируем исходный код
COPY src/ ./src/

# Копируем скрипт запуска и .env файл
COPY start.sh ./start.sh
COPY .env ./.env

# Создаем непривилегированного пользователя
RUN useradd -m -u 1000 ozonuser && \
    chown -R ozonuser:ozonuser /app && \
    chmod 755 /usr/local/bin/chromedriver && \
    chown ozonuser:ozonuser /usr/local/bin/chromedriver

# Делаем скрипт запуска исполняемым
RUN chmod +x start.sh

# Устанавливаем переменные окружения для Chrome
ENV DISPLAY=:99
ENV CHROME_BIN=/usr/bin/google-chrome
ENV CHROMEDRIVER_PATH=/usr/local/bin/chromedriver

# Открываем порты
EXPOSE 3002 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3005/health || exit 1

# Переключаемся на непривилегированного пользователя
USER ozonuser

# Запускаем приложение через скрипт
CMD ["./start.sh"] 