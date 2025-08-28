FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей (для лучшего кэширования)
COPY package*.json ./

# Устанавливаем зависимости (кэшируется отдельно)
RUN npm ci --only=production
RUN apk add --no-cache curl

# Копируем все файлы
COPY . .

# Генерируем Prisma клиент (после копирования схемы)
RUN npx prisma generate

# Собираем приложение (кэшируется отдельно)
RUN npm run build

# Открываем порты
EXPOSE 3003 50051

# Запускаем приложение
CMD ["npm", "run", "start:prod"] 