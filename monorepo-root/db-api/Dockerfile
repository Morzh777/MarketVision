FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей (для лучшего кэширования)
COPY package*.json ./

# Устанавливаем зависимости (кэшируется отдельно)
RUN npm ci --only=production

# Копируем Prisma схему (для кэширования генерации)
COPY prisma ./prisma/

# Генерируем Prisma клиент (кэшируется отдельно)
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение (кэшируется отдельно)
RUN npm run build

# Открываем порты
EXPOSE 3003 50051

# Запускаем приложение
CMD ["npm", "run", "start:prod"] 