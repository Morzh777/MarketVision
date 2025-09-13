# ===============================================
# Frontend API Dockerfile
# ===============================================

FROM node:18-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package файлы
COPY package*.json ./

# ===============================================
# Development stage
# ===============================================
FROM base AS development

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

# Открываем порт
EXPOSE 3010

# Команда для разработки
CMD ["npm", "run", "dev"]

# ===============================================
# Production build stage
# ===============================================
FROM base AS builder

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Сборка приложения
RUN npm run build

# ===============================================
# Production stage
# ===============================================
FROM base AS production

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем собранное приложение
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package*.json ./

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

# Открываем порт
EXPOSE 3010

# Команда для продакшена
CMD ["npm", "run", "start"]
