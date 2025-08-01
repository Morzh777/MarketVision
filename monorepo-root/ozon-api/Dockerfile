# Используем Python 3.11 slim образ
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости для Chrome и ChromeDriver
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    x11vnc \
    fluxbox \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем Chrome (поддержка ARM64 и AMD64)
RUN if [ "$(uname -m)" = "aarch64" ]; then \
        # Для ARM64 используем Chromium
        apt-get update && apt-get install -y chromium \
        && ln -s /usr/bin/chromium /usr/bin/google-chrome \
        && rm -rf /var/lib/apt/lists/*; \
    else \
        # Для AMD64 используем Google Chrome
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
        && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
        && apt-get update \
        && apt-get install -y google-chrome-stable \
        && rm -rf /var/lib/apt/lists/*; \
    fi

# Устанавливаем ChromeDriver (поддержка ARM64 и AMD64)
RUN if [ "$(uname -m)" = "aarch64" ]; then \
        # Для ARM64 используем chromedriver из пакетов
        apt-get update && apt-get install -y chromium-driver \
        && ln -s /usr/bin/chromedriver /usr/local/bin/chromedriver \
        && rm -rf /var/lib/apt/lists/*; \
    else \
        # Для AMD64 скачиваем ChromeDriver
        CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | awk -F'.' '{print $1}') \
        && wget -q "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION}" -O /tmp/chromedriver_version \
        && CHROMEDRIVER_VERSION=$(cat /tmp/chromedriver_version) \
        && wget -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" -O /tmp/chromedriver.zip \
        && unzip /tmp/chromedriver.zip -d /usr/local/bin/ \
        && rm /tmp/chromedriver.zip /tmp/chromedriver_version \
        && chmod +x /usr/local/bin/chromedriver; \
    fi

# Копируем файлы зависимостей (для лучшего кэширования)
COPY requirements.txt pyproject.toml ./

# Устанавливаем Python зависимости (кэшируется отдельно)
RUN pip install --no-cache-dir -r requirements.txt

# Копируем proto файлы
COPY proto/ ./proto/

# Копируем исходный код
COPY src/ ./src/

# Копируем скрипт запуска
COPY start.sh ./start.sh

# Создаем непривилегированного пользователя
RUN useradd -m -u 1000 ozonuser && chown -R ozonuser:ozonuser /app
# Даем права на chromedriver пользователю ozonuser
RUN chmod 755 /usr/bin/chromedriver && chown ozonuser:ozonuser /usr/bin/chromedriver
# Делаем скрипт запуска исполняемым
RUN chmod +x start.sh
USER ozonuser

# Устанавливаем переменные окружения для Chrome
ENV DISPLAY=:99
ENV CHROME_BIN=/usr/bin/google-chrome
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Открываем порты
EXPOSE 3002 3005

# Запускаем приложение через скрипт
CMD ["./start.sh"] 