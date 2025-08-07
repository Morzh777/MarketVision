# Этап разработки (development)
FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Открываем порт
EXPOSE 3006

# Команда для разработки (hot reload)
CMD ["npm", "run", "dev"]

# ---

# Этап сборки (builder)
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем Next.js приложение
RUN npm run build

# ---

# Финальный этап (production)
FROM node:18-alpine
RUN apk add --no-cache curl

WORKDIR /usr/src/app

# Создаем непривилегированного пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Копируем скомпилированный код из этапа сборки
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.js ./
COPY --from=builder /usr/src/app/package*.json ./

# Копируем node_modules (только production)
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Устанавливаем владельца файлов
RUN chown -R appuser:appgroup /usr/src/app

# Используем непривилегированного пользователя
USER appuser

# Открываем порт
EXPOSE 3006

# Команда для запуска приложения
CMD ["npm", "start"] 