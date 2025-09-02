# Этап сборки (builder)
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm install

# Копируем исходный код
COPY . .

# Development target
FROM node:18-alpine AS development
RUN apk add --no-cache curl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# Собираем TypeScript проект
RUN npm run build

# ---

# Финальный этап (production)
FROM node:18-alpine
RUN apk add --no-cache curl

WORKDIR /usr/src/app

# Создаем непривилегированного пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Копируем скомпилированный код из этапа сборки
COPY --from=builder /usr/src/app/dist ./dist

# Копируем node_modules (только production)
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Копируем package.json и package-lock.json
COPY --from=builder /usr/src/app/package*.json ./

# Копируем proto-файлы
COPY --from=builder /usr/src/app/proto ./proto


# Создаем директорию для логов и устанавливаем права
RUN mkdir -p logs && chown -R appuser:appgroup logs

# Устанавливаем владельца файлов
RUN chown -R appuser:appgroup /usr/src/app

# Используем непривилегированного пользователя
USER appuser

# Открываем порт
EXPOSE 3001

# Команда для запуска приложения
CMD ["node", "dist/main"]
