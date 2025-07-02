FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем proto файлы
COPY proto/ ./proto/

# Копируем исходный код
COPY src/ ./src/

# Копируем конфиг TypeScript
COPY tsconfig.json ./

# Устанавливаем dev зависимости для сборки
RUN npm ci

# Генерируем gRPC код из proto файлов
RUN npm run proto:gen

# Собираем приложение
RUN npm run build

# Удаляем dev зависимости
RUN npm ci --only=production && npm cache clean --force

# Создаем директорию для логов
RUN mkdir -p logs

# Открываем порт
EXPOSE 50051

# Запускаем приложение
CMD ["npm", "start"] 